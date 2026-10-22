export type RetailerId = "kroger" | "walmart";

/** A retailer product, normalised so the web app doesn't care where it came from. */
export interface Product {
  retailer: RetailerId;
  id: string;
  /** Kroger's cart API adds items by UPC. */
  upc?: string;
  name: string;
  brand?: string;
  size?: string;
  /** Regular price in USD; null when the retailer didn't return one (not zero). */
  price: number | null;
  promoPrice?: number | null;
  imageUrl?: string;
  /** null when the retailer didn't say. */
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

export class HttpError extends Error {
  status: number;
  body: Record<string, unknown>;
  constructor(status: number, message: string, body: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.body = body;
  }
}
