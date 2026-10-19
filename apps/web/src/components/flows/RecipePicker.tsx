import { useMemo, useState } from "react";
import { Button, IconButton } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Badge, Chip } from "../ui/primitives";
import { Sheet } from "../ui/Sheet";
import { conflictsWithUser, recipes, type Recipe } from "../../data/catalog";
import { RecipeFacts } from "./RecipeFacts";
import { ServingsStepper } from "./ServingsStepper";
import "./flows.css";

const filters: { label: string; test: (r: Recipe) => boolean }[] = [
  { label: "≤ 15 min", test: (r) => r.minutes <= 15 },
  { label: "Vegetarian", test: (r) => r.tags.includes("Vegetarian") || r.tags.includes("Vegan") },
  { label: "Vegan", test: (r) => r.tags.includes("Vegan") },
  { label: "High protein", test: (r) => r.tags.includes("High protein") },
];

/**
 * Searchable recipe list. When planning, recipes that conflict with the user's allergies are
 * shown but can't be chosen; when logging (allowConflicts) they stay selectable — it already happened.
 */
export function RecipeList({ onSelect, allowConflicts }: { onSelect: (r: Recipe) => void; allowConflicts?: boolean }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string[]>([]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes
      .filter((r) => !q || r.name.toLowerCase().includes(q))
      .filter((r) => filters.filter((f) => active.includes(f.label)).every((f) => f.test(r)))
      .sort((a, b) => conflictsWithUser(a).length - conflictsWithUser(b).length);
  }, [query, active]);

  return (
    <div className="stack gap-4">
      <div className="search">
        <Icon name="search" size={18} />
        <input
          className="search__input"
          type="search"
          placeholder="Search recipes"
          aria-label="Search recipes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="chips">
        {filters.map((f) => (
          <Chip
            key={f.label}
            selected={active.includes(f.label)}
            onToggle={() => setActive((l) => (l.includes(f.label) ? l.filter((x) => x !== f.label) : [...l, f.label]))}
          >
            {f.label}
          </Chip>
        ))}
      </div>
      <ul className="recipe-list">
        {results.map((r) => {
          const conflicts = conflictsWithUser(r);
          const blocked = !allowConflicts && conflicts.length > 0;
          return (
            <li key={r.id}>
              <button type="button" className="recipe-row" disabled={blocked} onClick={() => onSelect(r)}>
                <span className="recipe-row__thumb" aria-hidden="true">
                  <Icon name="utensils" size={18} />
                </span>
                <span className="stack recipe-row__text">
                  <span className="recipe-row__name">{r.name}</span>
                  <span className="recipe-row__meta tabular">
                    {r.minutes} min · {r.kcal === null ? "nutrition incomplete" : `~${r.kcal} kcal`}
                  </span>
                </span>
                {conflicts.length > 0 ? (
                  <Badge tone="danger" icon="alert">
                    Contains {conflicts.join(", ").toLowerCase()}
                  </Badge>
                ) : r.allergenUnresolved ? (
                  <Badge tone="warning" icon="alert">
                    Check allergens
                  </Badge>
                ) : (
                  <Icon name="chevronRight" size={18} className="subtle" />
                )}
              </button>
            </li>
          );
        })}
        {results.length === 0 && <li className="muted recipe-list__empty">No recipes match. Try fewer filters.</li>}
      </ul>
    </div>
  );
}

interface RecipePickerProps {
  open: boolean;
  title: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (recipeId: string, servings: number) => void;
}

/** Two-step sheet: choose a recipe → set servings and confirm. */
export function RecipePicker({ open, title, confirmLabel, onClose, onConfirm }: RecipePickerProps) {
  const [chosen, setChosen] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(1);

  const close = () => {
    setChosen(null);
    setServings(1);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title={chosen ? chosen.name : title}
      description={chosen ? title : "Filtered by your food preferences"}
      leading={chosen && <IconButton icon="chevronLeft" label="Back to recipes" onClick={() => setChosen(null)} />}
      footer={
        chosen && (
          <>
            <Button variant="ghost" onClick={() => setChosen(null)}>
              Back
            </Button>
            <Button
              icon="check"
              onClick={() => {
                onConfirm(chosen.id, servings);
                setChosen(null);
                setServings(1);
              }}
            >
              {confirmLabel}
            </Button>
          </>
        )
      }
    >
      {chosen ? (
        <div className="stack gap-6">
          {chosen.allergenUnresolved && (
            <div className="notice notice--warning">
              <Icon name="alert" size={16} />
              <span>Allergen information is incomplete for one ingredient. Check the product label before cooking.</span>
            </div>
          )}
          <RecipeFacts recipeId={chosen.id} servings={servings} />
          <div className="row spread">
            <span className="toggle-row__label">Servings</span>
            <ServingsStepper value={servings} onChange={setServings} />
          </div>
        </div>
      ) : (
        <RecipeList onSelect={setChosen} />
      )}
    </Sheet>
  );
}
