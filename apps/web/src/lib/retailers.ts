/**
 * Client for the NutriFit API's retailer endpoints (apps/api).
 * Retailer keys live on the server only; nothing here is secret.
 */

export type RetailerId = "kroger" | "walmart";

export interface Retailer {
  id: RetailerId;
  name: string;
  /** Credentials are set on the server. */
  configured: boolean;
  /** Kroger needs a store to price and stock items. */
  needsLocation: boolean;
  /** Kroger: the shopper has signed in to allow cart updates. */
  connected: boolean;
}

export interface Product {
  retailer: RetailerId;
  id: string;
  upc?: string;
  name: string;
  brand?: string;
  size?: string;
  price: number | null;
  promoPrice?: number | null;
  imageUrl?: string;
  available: boolean | null;
}

export interface Location {
  id: string;
  name: string;
  address: string;
}

export interface CartLine {
  productId: string;
  upc?: string;
  quantity: number;
}

export class ApiError extends Error {
  status: number;
  /** Set when the retailer needs the shopper to sign in first. */
  authorize?: string;
  constructor(status: number, message: string, authorize?: string) {
    super(message);
    this.status = status;
    this.authorize = authorize;
  }
}

const BASE = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { credentials: "include", ...init });
  } catch {
    throw new ApiError(0, "Can't reach the NutriFit server. Is apps/api running?");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? "Request failed.", body.authorize);
  return body as T;
}

export const getRetailers = () => request<Retailer[]>("/api/retailers");

export const findLocations = (zip: string) => request<Location[]>(`/api/kroger/locations?${new URLSearchParams({ zip })}`);

export const searchProducts = (retailer: RetailerId, term: string, locationId?: string) =>
  request<Product[]>(`/api/products?${new URLSearchParams({ retailer, term, ...(locationId ? { locationId } : {}) })}`);

export const handOff = (retailer: RetailerId, items: CartLine[]) =>
  request<{ url: string; added: number; status: "handed_off" }>("/api/handoff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ retailer, items }),
  });

export const krogerAuthorizeUrl = () => `${BASE}/api/kroger/authorize`;

export const disconnectKroger = () => request<{ ok: true }>("/api/kroger/disconnect", { method: "POST" });

/** Runs `fn` over `items` with at most `limit` in flight, to stay inside retailer rate limits. */
export async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export const formatPrice = (p: number | null | undefined) => (p == null ? null : `$${p.toFixed(2)}`);
