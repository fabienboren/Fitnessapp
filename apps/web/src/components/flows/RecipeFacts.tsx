import { Badge } from "../ui/primitives";
import { recipeById } from "../../data/catalog";
import "./flows.css";

/** Time and nutrition scaled to servings. Missing values render as "—", never 0. */
export function RecipeFacts({ recipeId, servings }: { recipeId: string; servings: number }) {
  const r = recipeById(recipeId);
  const scaled = (v: number | null) => (v === null ? "—" : Math.round(v * servings).toLocaleString());
  return (
    <div className="facts">
      <div className="facts__row">
        <Fact label="Time" value={`${r.minutes} min`} />
        <Fact label="kcal" value={scaled(r.kcal)} />
        <Fact label="Protein" value={r.protein === null ? "—" : `${scaled(r.protein)}g`} />
        <Fact label="Carbs" value={r.carbs === null ? "—" : `${scaled(r.carbs)}g`} />
      </div>
      <div className="row gap-2" style={{ flexWrap: "wrap" }}>
        {r.kcal === null ? (
          <Badge tone="warning" icon="alert">
            Nutrition incomplete
          </Badge>
        ) : (
          <Badge tone="info">Estimated · {servings === 1 ? "1 serving" : `${servings} servings`}</Badge>
        )}
        {r.tags.map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
        {r.allergens.length > 0 && <Badge tone="neutral">Contains: {r.allergens.join(", ")}</Badge>}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <span className="fact__value tabular">{value}</span>
      <span className="subtle fact__label">{label}</span>
    </div>
  );
}
