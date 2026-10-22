import { randomBytes } from "node:crypto";
import { config, krogerConfigured } from "./config.ts";
import { HttpError, type CartLine, type Location, type Product } from "./types.ts";

/**
 * Kroger Public API (https://developer.kroger.com/reference).
 *
 * - Products and Locations use an app token (client credentials).
 * - Adding to a shopper's cart needs their consent: authorization-code flow with
 *   the `cart.basic:write` scope. Those tokens are kept per session, server-side.
 */

interface Token {
  accessToken: string;
  refreshToken?: string;
  /** epoch ms */
  expiresAt: number;
}

const basicAuth = () =>
  "Basic " + Buffer.from(`${config.kroger.clientId}:${config.kroger.clientSecret}`).toString("base64");

async function requestToken(params: Record<string, string>): Promise<Token> {
  const res = await fetch(`${config.kroger.apiBase}/v1/connect/oauth2/token`, {
    method: "POST",
    headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  if (!res.ok) {
    console.error(`[kroger] token request failed: ${res.status} ${await res.text()}`);
    throw new HttpError(502, "Kroger rejected the credentials. Check KROGER_CLIENT_ID and KROGER_CLIENT_SECRET.");
  }
  const json = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    // Refresh a minute early so a request never races expiry.
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  };
}

/* ---------- App token (catalog + locations) ---------- */

let appToken: Token | null = null;

async function getAppToken(): Promise<string> {
  if (!krogerConfigured()) throw new HttpError(503, "Kroger isn't set up on the server.");
  if (!appToken || appToken.expiresAt <= Date.now()) {
    appToken = await requestToken({ grant_type: "client_credentials", scope: "product.compact" });
  }
  return appToken.accessToken;
}

async function krogerGet<T>(path: string, query: Record<string, string | undefined>): Promise<T> {
  const url = new URL(config.kroger.apiBase + path);
  for (const [k, v] of Object.entries(query)) if (v) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${await getAppToken()}`, Accept: "application/json" },
  });
  if (res.status === 401) appToken = null;
  if (!res.ok) {
    console.error(`[kroger] GET ${path} failed: ${res.status} ${await res.text()}`);
    throw new HttpError(502, "Kroger couldn't answer that request right now.");
  }
  return (await res.json()) as T;
}

interface KrogerLocation {
  locationId: string;
  name: string;
  address: { addressLine1: string; city: string; state: string; zipCode: string };
}

export async function findLocations(zip: string): Promise<Location[]> {
  if (!/^\d{5}$/.test(zip)) throw new HttpError(400, "Enter a 5-digit ZIP code.");
  const { data } = await krogerGet<{ data: KrogerLocation[] }>("/v1/locations", {
    "filter.zipCode.near": zip,
    "filter.limit": "10",
  });
  return data.map((l) => ({
    id: l.locationId,
    name: l.name,
    address: `${l.address.addressLine1}, ${l.address.city}, ${l.address.state} ${l.address.zipCode}`,
  }));
}

interface KrogerProduct {
  productId: string;
  upc: string;
  brand?: string;
  description: string;
  images?: { perspective: string; featured?: boolean; sizes: { size: string; url: string }[] }[];
  items?: {
    size?: string;
    price?: { regular: number; promo: number };
    inventory?: { stockLevel?: "HIGH" | "LOW" | "TEMPORARILY_OUT_OF_STOCK" };
    fulfillment?: { curbside?: boolean; delivery?: boolean; inStore?: boolean };
  }[];
}

export async function searchProducts(term: string, locationId?: string, limit = 5): Promise<Product[]> {
  const { data } = await krogerGet<{ data: KrogerProduct[] }>("/v1/products", {
    "filter.term": term,
    // Without a location Kroger returns no price or stock.
    "filter.locationId": locationId,
    "filter.limit": String(limit),
  });
  return data.map((p) => {
    const item = p.items?.[0];
    const image = p.images?.find((i) => i.featured) ?? p.images?.[0];
    const stock = item?.inventory?.stockLevel;
    return {
      retailer: "kroger",
      id: p.productId,
      upc: p.upc,
      name: p.description,
      brand: p.brand,
      size: item?.size,
      price: item?.price?.regular || null,
      promoPrice: item?.price?.promo || null,
      imageUrl: image?.sizes.find((s) => s.size === "medium")?.url ?? image?.sizes[0]?.url,
      available: stock ? stock !== "TEMPORARILY_OUT_OF_STOCK" : null,
    };
  });
}

/* ---------- Shopper authorization (cart) ---------- */

interface ShopperSession {
  oauthState?: string;
  token?: Token;
}

/** In-memory; swap for your database/session store before running more than one instance. */
const sessions = new Map<string, ShopperSession>();

const session = (sid: string) => {
  let s = sessions.get(sid);
  if (!s) sessions.set(sid, (s = {}));
  return s;
};

export const isShopperConnected = (sid: string) => Boolean(sessions.get(sid)?.token);

export function disconnectShopper(sid: string) {
  sessions.delete(sid);
}

export function authorizeUrl(sid: string): string {
  if (!krogerConfigured()) throw new HttpError(503, "Kroger isn't set up on the server.");
  const state = randomBytes(16).toString("hex");
  session(sid).oauthState = state;
  const url = new URL(`${config.kroger.apiBase}/v1/connect/oauth2/authorize`);
  url.searchParams.set("scope", "cart.basic:write profile.compact");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.kroger.clientId!);
  url.searchParams.set("redirect_uri", config.kroger.redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

export async function completeAuthorization(sid: string, code: string, state: string) {
  const s = sessions.get(sid);
  if (!s?.oauthState || s.oauthState !== state) throw new HttpError(400, "This Kroger sign-in link has expired. Try again.");
  s.oauthState = undefined;
  s.token = await requestToken({ grant_type: "authorization_code", code, redirect_uri: config.kroger.redirectUri });
}

async function shopperToken(sid: string): Promise<string> {
  if (!krogerConfigured()) throw new HttpError(503, "Kroger isn't set up on the server.");
  const s = sessions.get(sid);
  if (!s?.token) throw new HttpError(401, "Connect your Kroger account first.", { authorize: "/api/kroger/authorize" });
  if (s.token.expiresAt <= Date.now()) {
    if (!s.token.refreshToken) {
      s.token = undefined;
      throw new HttpError(401, "Your Kroger sign-in expired.", { authorize: "/api/kroger/authorize" });
    }
    try {
      s.token = await requestToken({ grant_type: "refresh_token", refresh_token: s.token.refreshToken });
    } catch {
      s.token = undefined;
      throw new HttpError(401, "Your Kroger sign-in expired.", { authorize: "/api/kroger/authorize" });
    }
  }
  return s.token.accessToken;
}

/**
 * Adds items to the shopper's Kroger cart. This does NOT place an order —
 * the shopper still reviews and checks out on kroger.com.
 */
export async function addToCart(sid: string, lines: CartLine[], modality: "PICKUP" | "DELIVERY" = "PICKUP") {
  const items = lines
    .filter((l) => l.upc)
    .map((l) => ({ upc: l.upc!, quantity: Math.max(1, Math.round(l.quantity)), modality }));
  if (items.length === 0) throw new HttpError(400, "None of these items can be added to a Kroger cart.");

  const res = await fetch(`${config.kroger.apiBase}/v1/cart/add`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${await shopperToken(sid)}`, "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (res.status === 401) {
    sessions.get(sid)!.token = undefined;
    throw new HttpError(401, "Your Kroger sign-in expired.", { authorize: "/api/kroger/authorize" });
  }
  if (!res.ok) {
    console.error(`[kroger] cart add failed: ${res.status} ${await res.text()}`);
    throw new HttpError(502, "Kroger didn't accept the cart update.");
  }
  return { url: "https://www.kroger.com/cart", added: items.length };
}
