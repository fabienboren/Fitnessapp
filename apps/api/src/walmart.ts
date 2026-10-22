import { createSign } from "node:crypto";
import { config, walmartConfigured } from "./config.ts";
import { HttpError, type CartLine, type Product } from "./types.ts";

/**
 * Walmart Affiliate API (https://walmart.io/docs/affiliates).
 *
 * Every request is signed with your RSA private key. Walmart has no public cart
 * API for third parties: the handoff is an affiliate add-to-cart link that the
 * shopper opens and checks out from on walmart.com.
 */

const API_BASE = "https://developer.api.walmart.com/api-proxy/service/affil/product/v2";

function signedHeaders(): Record<string, string> {
  if (!walmartConfigured()) throw new HttpError(503, "Walmart isn't set up on the server.");
  const { consumerId, keyVersion, privateKey } = config.walmart;
  const timestamp = Date.now().toString();
  // Walmart signs the header values in this order, each followed by a newline.
  const payload = `${consumerId}\n${timestamp}\n${keyVersion}\n`;
  let signature: string;
  try {
    signature = createSign("RSA-SHA256").update(payload).sign(privateKey!, "base64");
  } catch {
    throw new HttpError(503, "The Walmart private key on the server couldn't be read.");
  }
  return {
    "WM_CONSUMER.ID": consumerId!,
    "WM_CONSUMER.INTIMESTAMP": timestamp,
    "WM_SEC.KEY_VERSION": keyVersion,
    "WM_SEC.AUTH_SIGNATURE": signature,
    Accept: "application/json",
  };
}

interface WalmartItem {
  itemId: number;
  name: string;
  brandName?: string;
  size?: string;
  salePrice?: number;
  msrp?: number;
  mediumImage?: string;
  thumbnailImage?: string;
  stock?: string;
  availableOnline?: boolean;
  upc?: string;
}

export async function searchProducts(term: string, limit = 5): Promise<Product[]> {
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.set("query", term);
  url.searchParams.set("numItems", String(limit));
  if (config.walmart.publisherId) url.searchParams.set("publisherId", config.walmart.publisherId);

  const res = await fetch(url, { headers: signedHeaders() });
  if (!res.ok) {
    console.error(`[walmart] search failed: ${res.status} ${await res.text()}`);
    throw new HttpError(
      502,
      res.status === 401 || res.status === 403
        ? "Walmart rejected the signature. Check WALMART_CONSUMER_ID, WALMART_KEY_VERSION and the private key."
        : "Walmart couldn't answer that request right now.",
    );
  }
  const { items = [] } = (await res.json()) as { items?: WalmartItem[] };
  return items.map((i) => ({
    retailer: "walmart",
    id: String(i.itemId),
    upc: i.upc,
    name: i.name,
    brand: i.brandName,
    size: i.size,
    price: i.salePrice ?? i.msrp ?? null,
    imageUrl: i.mediumImage ?? i.thumbnailImage,
    available: i.stock ? i.stock.toLowerCase() === "available" : (i.availableOnline ?? null),
  }));
}

/** Builds the affiliate add-to-cart link. Opening it fills the cart; it doesn't order anything. */
export function cartUrl(lines: CartLine[]) {
  const items = lines
    .filter((l) => /^\d+$/.test(l.productId))
    .map((l) => `${l.productId}|${Math.max(1, Math.round(l.quantity))}`);
  if (items.length === 0) throw new HttpError(400, "None of these items can be added to a Walmart cart.");
  const url = new URL("https://affil.walmart.com/cart/addToCart");
  url.searchParams.set("items", items.join(","));
  return { url: url.toString(), added: items.length };
}
