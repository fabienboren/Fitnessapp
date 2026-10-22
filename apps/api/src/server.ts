import { randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { config, krogerConfigured, walmartConfigured } from "./config.ts";
import * as kroger from "./kroger.ts";
import { HttpError, type CartLine, type RetailerId } from "./types.ts";
import * as walmart from "./walmart.ts";

/**
 * NutriFit retailer API. Holds the Kroger and Walmart credentials so the web app
 * never sees them. In development the web app reaches it through Vite's /api proxy.
 *
 *   GET  /api/retailers                       which retailers are set up / connected
 *   GET  /api/kroger/locations?zip=           nearby Kroger-family stores
 *   GET  /api/products?retailer=&term=[&locationId=]
 *   POST /api/handoff  { retailer, items: [{ productId, upc?, quantity }] }
 *   GET  /api/kroger/authorize | /api/kroger/callback | POST /api/kroger/disconnect
 */

const SID_COOKIE = "nf_sid";

function sessionId(req: IncomingMessage, res: ServerResponse): string {
  const match = req.headers.cookie?.match(new RegExp(`(?:^|;\\s*)${SID_COOKIE}=([a-f0-9]{32})`));
  if (match) return match[1];
  const sid = randomBytes(16).toString("hex");
  const secure = config.webOrigin.startsWith("https://") ? "; Secure" : "";
  // Lax so the cookie survives the top-level redirect back from Kroger's sign-in.
  res.setHeader("Set-Cookie", `${SID_COOKIE}=${sid}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`);
  return sid;
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function redirect(res: ServerResponse, location: string) {
  res.writeHead(302, { Location: location });
  res.end();
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 100_000) throw new HttpError(413, "Request too large.");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Expected a JSON body.");
  }
}

function parseRetailer(value: unknown): RetailerId {
  if (value === "kroger" || value === "walmart") return value;
  throw new HttpError(400, "retailer must be 'kroger' or 'walmart'.");
}

function parseLines(value: unknown): CartLine[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    throw new HttpError(400, "items must be a list of 1–100 products.");
  }
  return value.map((v) => {
    const line = v as Partial<CartLine>;
    if (typeof line.productId !== "string" || !line.productId) throw new HttpError(400, "Each item needs a productId.");
    return {
      productId: line.productId,
      upc: typeof line.upc === "string" ? line.upc : undefined,
      quantity: typeof line.quantity === "number" && line.quantity > 0 ? Math.min(line.quantity, 99) : 1,
    };
  });
}

async function route(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const sid = sessionId(req, res);
  const key = `${req.method} ${url.pathname}`;

  switch (key) {
    case "GET /api/retailers":
      return send(res, 200, [
        { id: "kroger", name: "Kroger", configured: krogerConfigured(), needsLocation: true, connected: kroger.isShopperConnected(sid) },
        { id: "walmart", name: "Walmart", configured: walmartConfigured(), needsLocation: false, connected: walmartConfigured() },
      ]);

    case "GET /api/kroger/locations":
      return send(res, 200, await kroger.findLocations(url.searchParams.get("zip") ?? ""));

    case "GET /api/products": {
      const retailer = parseRetailer(url.searchParams.get("retailer"));
      const term = url.searchParams.get("term")?.trim();
      if (!term || term.length > 100) throw new HttpError(400, "term is required.");
      const products =
        retailer === "kroger"
          ? await kroger.searchProducts(term, url.searchParams.get("locationId") ?? undefined)
          : await walmart.searchProducts(term);
      return send(res, 200, products);
    }

    case "POST /api/handoff": {
      const body = (await readJson(req)) as { retailer?: unknown; items?: unknown };
      const retailer = parseRetailer(body.retailer);
      const lines = parseLines(body.items);
      const result = retailer === "kroger" ? await kroger.addToCart(sid, lines) : walmart.cartUrl(lines);
      // "handed_off", never "ordered": the shopper still checks out at the store.
      return send(res, 200, { ...result, status: "handed_off" });
    }

    case "GET /api/kroger/authorize":
      return redirect(res, kroger.authorizeUrl(sid));

    case "GET /api/kroger/callback": {
      const back = new URL("/app/groceries", config.webOrigin);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code || !state) {
        back.searchParams.set("kroger", "denied");
        return redirect(res, back.toString());
      }
      try {
        await kroger.completeAuthorization(sid, code, state);
        back.searchParams.set("kroger", "connected");
      } catch (err) {
        console.error("[kroger] authorization failed", err);
        back.searchParams.set("kroger", "error");
      }
      return redirect(res, back.toString());
    }

    case "POST /api/kroger/disconnect":
      kroger.disconnectShopper(sid);
      return send(res, 200, { ok: true });

    default:
      throw new HttpError(404, "Not found.");
  }
}

const server = createServer(async (req, res) => {
  // Allow the web app when it isn't served through the proxy (e.g. a deployed static site).
  const origin = req.headers.origin;
  if (origin === config.webOrigin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }
  try {
    await route(req, res);
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, { error: err.message, ...err.body });
    console.error(err);
    send(res, 500, { error: "Something went wrong." });
  }
});

server.listen(config.port, () => {
  const status = (ok: boolean) => (ok ? "ready" : "not configured");
  console.log(`NutriFit API on http://localhost:${config.port}`);
  console.log(`  Kroger:  ${status(krogerConfigured())}`);
  console.log(`  Walmart: ${status(walmartConfigured())}`);
});
