import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StoreHandoffSheet } from "../components/flows/StoreHandoffSheet";
import { Button, IconButton } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Badge, Card, ProgressBar, Segmented } from "../components/ui/primitives";
import { Sheet } from "../components/ui/Sheet";
import { useToast } from "../components/ui/Toast";
import { aisles, groceryItems, type GroceryItem } from "../data/catalog";
import "./dashboard.css";
import "./groceries.css";

type Mode = "edit" | "shop";
type Handoff = "idle" | "review" | "handed_off";

export function GroceriesPage() {
  const toast = useToast();
  const [items, setItems] = useState<GroceryItem[]>(groceryItems);
  const [mode, setMode] = useState<Mode>("edit");
  const [newItem, setNewItem] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);
  const [handoff, setHandoff] = useState<Handoff>("idle");
  const [resolving, setResolving] = useState<{ id: string; value: string } | null>(null);
  const [store, setStore] = useState("the store");
  const [params, setParams] = useSearchParams();

  // Back from Kroger's sign-in page.
  useEffect(() => {
    const result = params.get("kroger");
    if (!result) return;
    if (result === "connected") {
      toast({ message: "Kroger account connected" });
      setHandoff("review");
    } else {
      toast({ message: result === "denied" ? "Kroger sign-in was cancelled" : "Couldn't connect to Kroger. Try again." });
    }
    setParams((p) => {
      p.delete("kroger");
      return p;
    }, { replace: true });
  }, [params, setParams, toast]);

  const checked = items.filter((i) => i.checked).length;
  const unresolved = items.filter((i) => i.unresolved);
  const manualCount = items.filter((i) => i.manual).length;

  const patch = (id: string, change: Partial<GroceryItem>) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...change } : i)));

  const addItem = () => {
    const name = newItem.trim();
    if (!name) return;
    setItems((list) => [...list, { id: `m${Date.now()}`, name, quantity: null, aisle: "Pantry", checked: false, from: [], manual: true }]);
    setNewItem("");
  };

  const visibleIn = (aisle: string) =>
    items.filter((i) => i.aisle === aisle && !i.unresolved && (mode === "edit" || !i.checked));
  const inCart = items.filter((i) => i.checked);

  return (
    <div className="groceries">
      <header className="page-head">
        <div className="stack gap-1">
          <h1 className="page-title">Grocery list</h1>
          <p className="muted">Week of Oct 19 · generated from your saved plan</p>
        </div>
        <div className="page-head__actions">
          <Button variant="secondary" icon="calendar" onClick={() => setRegenOpen(true)}>
            Update from plan
          </Button>
          <Button icon="cart" onClick={() => setHandoff("review")}>
            Send to store
          </Button>
        </div>
      </header>

      {handoff === "handed_off" && (
        <div className="notice handoff-status" role="status">
          <Icon name="external" size={16} />
          <span>
            <strong>Basket opened at {store} — not ordered yet.</strong> Finish checkout there. We'll mark this list as
            ordered only if the store confirms it.
          </span>
        </div>
      )}

      <div className="groc-layout">
        <div className="groc-main">
          {/* Progress + mode */}
          <Card className="groc-progress">
            <div className="row spread gap-4" style={{ flexWrap: "wrap" }}>
              <div className="stack gap-1">
                <span className="stat tabular">
                  {checked}
                  <span className="subtle stat__of"> / {items.length} items</span>
                </span>
              </div>
              <Segmented
                label="List mode"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "edit", label: "Plan" },
                  { value: "shop", label: "Shopping" },
                ]}
              />
            </div>
            <ProgressBar value={checked} max={items.length} label="Items checked" />
          </Card>

          {/* Needs review */}
          {unresolved.length > 0 && (
            <Card className="review-card" aria-labelledby="review-title">
              <div className="row gap-2">
                <Icon name="alert" size={18} />
                <h2 id="review-title" className="card__title">
                  {unresolved.length} {unresolved.length === 1 ? "item needs" : "items need"} a quantity
                </h2>
              </div>
              <p className="muted review-card__lede">
                These recipes use units we can't add together without a reliable conversion.
              </p>
              <ul className="review-list">
                {unresolved.map((i) => (
                  <li key={i.id} className="review-item">
                    <div className="stack gap-1">
                      <strong>{i.name}</strong>
                      <span className="muted review-item__parts">
                        {i.unresolved!.map((part, n) => (
                          <span key={n}>
                            {n > 0 && <span aria-hidden="true"> + </span>}
                            <span className="qty-pill tabular">{part}</span>
                            <span className="subtle"> {i.from[n]}</span>
                          </span>
                        ))}
                      </span>
                    </div>
                    {resolving?.id === i.id ? (
                      <form
                        className="review-item__form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!resolving.value.trim()) return;
                          patch(i.id, { quantity: resolving.value.trim(), unresolved: undefined });
                          setResolving(null);
                        }}
                      >
                        <input
                          autoFocus
                          className="input"
                          aria-label={`Total amount of ${i.name}`}
                          placeholder="e.g. 250 g"
                          value={resolving.value}
                          onChange={(e) => setResolving({ id: i.id, value: e.target.value })}
                        />
                        <Button type="submit" size="sm">
                          Save
                        </Button>
                      </form>
                    ) : (
                      <div className="row gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => patch(i.id, { quantity: i.unresolved!.join(" + "), unresolved: undefined })}
                        >
                          Keep both
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setResolving({ id: i.id, value: "" })}>
                          Enter total
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Add item */}
          {mode === "edit" && (
            <form
              className="add-item"
              onSubmit={(e) => {
                e.preventDefault();
                addItem();
              }}
            >
              <Icon name="plus" size={18} />
              <input
                className="add-item__input"
                placeholder="Add an item — e.g. coffee, paper towels"
                aria-label="Add an item"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
              />
              <Button type="submit" size="sm" disabled={!newItem.trim()}>
                Add
              </Button>
            </form>
          )}

          {/* Aisles */}
          {aisles.map((aisle) => {
            const list = visibleIn(aisle);
            if (list.length === 0) return null;
            return (
              <section key={aisle} className="aisle" aria-labelledby={`aisle-${aisle}`}>
                <h2 id={`aisle-${aisle}`} className="aisle__title">
                  {aisle} <span className="subtle tabular">{list.length}</span>
                </h2>
                <ul className="items">
                  {list.map((i) => (
                    <ItemRow
                      key={i.id}
                      item={i}
                      mode={mode}
                      expanded={expanded === i.id}
                      onToggle={() => patch(i.id, { checked: !i.checked })}
                      onExpand={() => setExpanded((e) => (e === i.id ? null : i.id))}
                      onRemove={() => setItems((l) => l.filter((x) => x.id !== i.id))}
                    />
                  ))}
                </ul>
              </section>
            );
          })}

          {mode === "shop" && inCart.length > 0 && (
            <details className="in-cart">
              <summary>
                In your cart <span className="subtle tabular">{inCart.length}</span>
              </summary>
              <ul className="items">
                {inCart.map((i) => (
                  <ItemRow key={i.id} item={i} mode={mode} expanded={false} onToggle={() => patch(i.id, { checked: false })} />
                ))}
              </ul>
            </details>
          )}
        </div>

        <aside className="groc-aside">
          <Card>
            <h2 className="card__title">How this list works</h2>
            <ul className="explain">
              <li>
                <Icon name="check" size={16} /> Same ingredients across recipes are combined when units match.
              </li>
              <li>
                <Icon name="alert" size={16} /> Different units stay separate until you decide.
              </li>
              <li>
                <Icon name="user" size={16} /> Items you add are kept when your plan changes.
              </li>
            </ul>
          </Card>
        </aside>
      </div>

      {/* Regenerate */}
      <Sheet
        open={regenOpen}
        onClose={() => setRegenOpen(false)}
        title="Update from your plan?"
        description="Recalculates quantities from your saved meal plan."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRegenOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setRegenOpen(false);
                toast({ message: `List updated · ${manualCount} items you added were kept` });
              }}
            >
              Update list
            </Button>
          </>
        }
      >
        <ul className="checks">
          <li className="check-row check-row--ok">
            <span className="check-row__icon">
              <Icon name="check" size={14} />
            </span>
            <div className="stack">
              <strong>{manualCount} items you added stay</strong>
              <span className="muted">Manual items are never removed by an update.</span>
            </div>
          </li>
          <li className="check-row check-row--ok">
            <span className="check-row__icon">
              <Icon name="check" size={14} />
            </span>
            <div className="stack">
              <strong>Checked items stay checked</strong>
              <span className="muted">Unless the amount you need goes up.</span>
            </div>
          </li>
          <li className="check-row check-row--warn">
            <span className="check-row__icon">
              <Icon name="info" size={14} />
            </span>
            <div className="stack">
              <strong>Pantry deductions are off</strong>
              <span className="muted">Turn on pantry tracking in settings to subtract what you have.</span>
            </div>
          </li>
        </ul>
      </Sheet>

      {/* Retailer handoff */}
      <StoreHandoffSheet
        open={handoff === "review"}
        onClose={() => setHandoff("idle")}
        items={items.filter((i) => !i.checked)}
        onHandedOff={(name) => {
          setStore(name);
          setHandoff("handed_off");
        }}
      />
    </div>
  );
}

interface ItemRowProps {
  item: GroceryItem;
  mode: Mode;
  expanded: boolean;
  onToggle: () => void;
  onExpand?: () => void;
  onRemove?: () => void;
}

function ItemRow({ item, mode, expanded, onToggle, onExpand, onRemove }: ItemRowProps) {
  const id = `item-${item.id}`;
  return (
    <li className={`item ${item.checked ? "is-checked" : ""} ${mode === "shop" ? "item--shop" : ""}`}>
      <input id={id} type="checkbox" className="item__check" checked={item.checked} onChange={onToggle} />
      <label htmlFor={id} className="item__body">
        <span className="item__name">{item.name}</span>
        {item.quantity && <span className="item__qty tabular">{item.quantity}</span>}
      </label>
      {mode === "edit" &&
        (item.manual ? (
          <>
            <Badge>Added by you</Badge>
            {onRemove && <IconButton icon="trash" label={`Remove ${item.name}`} onClick={onRemove} />}
          </>
        ) : (
          onExpand && (
            <button type="button" className="item__from" aria-expanded={expanded} onClick={onExpand}>
              {item.from.length} {item.from.length === 1 ? "recipe" : "recipes"}
              <Icon name="chevronDown" size={14} />
            </button>
          )
        ))}
      {expanded && (
        <ul className="item__sources">
          {item.from.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </li>
  );
}
