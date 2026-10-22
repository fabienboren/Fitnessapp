import { useEffect, useState } from "react";
import type { GroceryItem } from "../../data/catalog";
import {
  ApiError,
  findLocations,
  formatPrice,
  getRetailers,
  handOff,
  krogerAuthorizeUrl,
  mapLimited,
  searchProducts,
  type Location,
  type Product,
  type Retailer,
  type RetailerId,
} from "../../lib/retailers";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Badge, Field, Segmented } from "../ui/primitives";
import { Sheet } from "../ui/Sheet";

interface Match {
  item: GroceryItem;
  products: Product[];
  /** Index into products, or null when skipped / nothing found. */
  selected: number | null;
}

interface StoreHandoffSheetProps {
  open: boolean;
  onClose: () => void;
  /** Unchecked items; checked ones are already in the shopper's cart. */
  items: GroceryItem[];
  onHandedOff: (store: string) => void;
}

/**
 * Matches the grocery list to a real retailer's products, then opens that store's
 * cart. Nothing is purchased here — the shopper checks out at the store.
 */
export function StoreHandoffSheet({ open, onClose, items, onHandedOff }: StoreHandoffSheetProps) {
  const [retailers, setRetailers] = useState<Retailer[] | null>(null);
  const [retailerId, setRetailerId] = useState<RetailerId>("kroger");
  const [zip, setZip] = useState("");
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [locationId, setLocationId] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [busy, setBusy] = useState<"locations" | "matching" | "sending" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    getRetailers()
      .then((list) => {
        setRetailers(list);
        const first = list.find((r) => r.configured);
        if (first && !list.find((r) => r.id === retailerId)?.configured) setRetailerId(first.id);
      })
      .catch((e: ApiError) => setError(e.message));
  }, [open]);

  const retailer = retailers?.find((r) => r.id === retailerId);
  const available = retailers?.filter((r) => r.configured) ?? [];

  const pickRetailer = (id: RetailerId) => {
    setRetailerId(id);
    setMatches(null);
    setError(null);
  };

  const lookUpStores = async () => {
    setBusy("locations");
    setError(null);
    try {
      const list = await findLocations(zip.trim());
      setLocations(list);
      setLocationId(list[0]?.id ?? "");
      setMatches(null);
      if (list.length === 0) setError("No Kroger-family stores near that ZIP code.");
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(null);
    }
  };

  const findMatches = async () => {
    setBusy("matching");
    setError(null);
    try {
      const result = await mapLimited(items, 4, async (item) => {
        const products = await searchProducts(retailerId, item.name, retailer?.needsLocation ? locationId : undefined);
        const firstInStock = products.findIndex((p) => p.available !== false);
        return { item, products, selected: firstInStock === -1 ? null : firstInStock };
      });
      setMatches(result);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    if (!matches || !retailer) return;
    if (needsSignIn) {
      window.location.href = krogerAuthorizeUrl();
      return;
    }
    const lines = matches
      .filter((m) => m.selected !== null)
      .map((m) => {
        const p = m.products[m.selected!];
        // List quantities ("500 g", "2 heads") don't map to product counts, so one of each.
        return { productId: p.id, upc: p.upc, quantity: 1 };
      });
    // Open the tab now, while we still have the click, so pop-up blockers allow it.
    const tab = window.open("", "_blank");
    setBusy("sending");
    setError(null);
    try {
      const { url } = await handOff(retailerId, lines);
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else {
        window.location.href = url;
      }
      onHandedOff(retailer.name);
    } catch (e) {
      tab?.close();
      const err = e as ApiError;
      if (err.status === 401 && err.authorize) {
        window.location.href = krogerAuthorizeUrl();
        return;
      }
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const matched = matches?.filter((m) => m.selected !== null) ?? [];
  const unavailable = matches?.filter((m) => m.products.length === 0 || m.products.every((p) => p.available === false)) ?? [];
  const skipped = (matches?.length ?? 0) - matched.length - unavailable.length;
  const prices = matched.map((m) => m.products[m.selected!]).map((p) => p.promoPrice ?? p.price);
  const knownTotal = prices.reduce<number>((sum, p) => sum + (p ?? 0), 0);
  const missingPrices = prices.filter((p) => p == null).length;

  const canMatch = Boolean(retailer?.configured && (!retailer.needsLocation || locationId) && items.length > 0);
  const needsSignIn = retailerId === "kroger" && retailer && !retailer.connected;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={retailer ? `Send to ${retailer.name}` : "Send to a store"}
      description="Review matches before opening the store. Nothing is purchased here."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {matches ? (
            <Button iconRight="external" onClick={send} disabled={matched.length === 0 || busy !== null}>
              {busy === "sending" ? "Opening…" : needsSignIn ? "Sign in to Kroger & continue" : "Continue to store"}
            </Button>
          ) : (
            <Button icon="search" onClick={findMatches} disabled={!canMatch || busy !== null}>
              {busy === "matching" ? "Finding matches…" : "Find matches"}
            </Button>
          )}
        </>
      }
    >
      <div className="stack gap-6">
        {retailers && available.length === 0 && (
          <div className="notice notice--warning">
            <Icon name="alert" size={16} />
            <span>No stores are set up yet. Add Kroger or Walmart keys to the server's <code>.env</code> and restart it.</span>
          </div>
        )}

        {available.length > 1 && (
          <Segmented
            label="Store"
            value={retailerId}
            onChange={pickRetailer}
            options={available.map((r) => ({ value: r.id, label: r.name }))}
          />
        )}

        {retailer?.configured && retailer.needsLocation && (
          <div className="stack gap-3">
            <form
              className="row gap-2"
              style={{ alignItems: "flex-end" }}
              onSubmit={(e) => {
                e.preventDefault();
                lookUpStores();
              }}
            >
              <div style={{ flex: 1 }}>
                <Field label="ZIP code">
                  {(id) => (
                    <input
                      id={id}
                      className="input"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="45202"
                      value={zip}
                      onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                    />
                  )}
                </Field>
              </div>
              <Button type="submit" variant="secondary" disabled={zip.length !== 5 || busy !== null}>
                {busy === "locations" ? "Searching…" : "Find stores"}
              </Button>
            </form>
            {locations && locations.length > 0 && (
              <Field label="Store" hint="Prices and stock are for this store.">
                {(id, hintId) => (
                  <select
                    id={id}
                    aria-describedby={hintId}
                    className="select"
                    value={locationId}
                    onChange={(e) => {
                      setLocationId(e.target.value);
                      setMatches(null);
                    }}
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} — {l.address}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            )}
          </div>
        )}

        {matches && (
          <>
            <div className="handoff-stats">
              <div>
                <span className="stat tabular">{matched.length}</span>
                <span className="subtle">matched</span>
              </div>
              <div>
                <span className="stat tabular">{skipped}</span>
                <span className="subtle">skipped</span>
              </div>
              <div>
                <span className="stat tabular">{unavailable.length}</span>
                <span className="subtle">unavailable</span>
              </div>
            </div>
            <div className="stack gap-3">
              <p className="eyebrow">Check each match</p>
              {matches.map((m, n) => (
                <div key={m.item.id} className="match-row">
                  <div className="stack" style={{ minWidth: 0, flex: 1 }}>
                    <strong>{m.item.name}</strong>
                    {m.products.length === 0 ? (
                      <span className="muted">Not found at this store — stays on your list</span>
                    ) : (
                      <select
                        className="select"
                        aria-label={`Product for ${m.item.name}`}
                        value={m.selected ?? ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : Number(e.target.value);
                          setMatches((list) => list!.map((x, i) => (i === n ? { ...x, selected: value } : x)));
                        }}
                      >
                        <option value="">Skip this item</option>
                        {m.products.map((p, i) => (
                          <option key={p.id} value={i} disabled={p.available === false}>
                            {[p.brand && !p.name.startsWith(p.brand) ? p.brand : null, p.name, p.size].filter(Boolean).join(" · ")}
                            {formatPrice(p.promoPrice ?? p.price) ? ` — ${formatPrice(p.promoPrice ?? p.price)}` : ""}
                            {p.available === false ? " (out of stock)" : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {m.products.length === 0 || m.products.every((p) => p.available === false) ? (
                    <Badge tone="warning">Unavailable</Badge>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="notice">
              <Icon name="info" size={16} />
              <span>
                {matched.length > 0 && (
                  <>
                    Estimated basket {formatPrice(knownTotal)}
                    {missingPrices > 0 && ` plus ${missingPrices} item${missingPrices === 1 ? "" : "s"} without a price`}.{" "}
                  </>
                )}
                One of each product is added — adjust amounts in the store's cart. Final prices, substitutions and availability
                are set by the store at checkout. Checked items aren't sent.
              </span>
            </div>
          </>
        )}

        {needsSignIn && matches && (
          <p className="muted">Kroger asks you to sign in once so we can add these items to your Kroger cart.</p>
        )}

        {error && (
          <div className="notice notice--warning" role="alert">
            <Icon name="alert" size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Sheet>
  );
}
