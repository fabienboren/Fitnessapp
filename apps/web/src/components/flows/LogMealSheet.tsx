import { useEffect, useState } from "react";
import { Button, IconButton } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Badge, Field, Segmented } from "../ui/primitives";
import { Sheet } from "../ui/Sheet";
import { recipeById, type Recipe } from "../../data/catalog";
import type { PlannedMeal } from "../../data/mock";
import { RecipeList } from "./RecipePicker";
import "./flows.css";

export interface MealLog {
  id: string;
  name: string;
  plannedMealId?: string;
  recipeId?: string;
  /** Servings actually eaten */
  portion: number;
  time: string;
  /** Per-portion totals; null = unknown, never zero */
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  source: "calculated" | "user";
}

type Source = "plan" | "recipe" | "quick";
type Choice =
  | { kind: "planned"; meal: PlannedMeal }
  | { kind: "recipe"; recipe: Recipe }
  | { kind: "quick"; name: string; kcal: number | null };

const portions = [0.25, 0.5, 0.75, 1, 1.5, 2];
const portionLabel = (p: number) => ({ 0.25: "¼", 0.5: "½", 0.75: "¾", 1: "1", 1.5: "1½", 2: "2" })[p] ?? String(p);

const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

interface LogMealSheetProps {
  open: boolean;
  onClose: () => void;
  plannedMeals: PlannedMeal[];
  /** Jump straight to the portion step for a planned meal. */
  preselect?: PlannedMeal | null;
  onLog: (log: MealLog) => void;
}

export function LogMealSheet({ open, onClose, plannedMeals, preselect, onLog }: LogMealSheetProps) {
  const [source, setSource] = useState<Source>("plan");
  const [choice, setChoice] = useState<Choice | null>(null);
  const [portion, setPortion] = useState(1);
  const [time, setTime] = useState(nowTime);
  const [quickName, setQuickName] = useState("");
  const [quickKcal, setQuickKcal] = useState("");

  useEffect(() => {
    if (!open) return;
    setSource("plan");
    setChoice(preselect ? { kind: "planned", meal: preselect } : null);
    setPortion(1);
    setTime(preselect ? preselect.time.padStart(5, "0") : nowTime());
    setQuickName("");
    setQuickKcal("");
  }, [open, preselect]);

  const recipe =
    choice?.kind === "recipe" ? choice.recipe : choice?.kind === "planned" ? recipeById(choice.meal.recipeId) : null;
  const name = choice?.kind === "quick" ? choice.name : choice?.kind === "planned" ? choice.meal.recipeName : recipe?.name ?? "";
  const scale = (v: number | null | undefined) => (v === null || v === undefined ? null : Math.round(v * portion));
  const kcal = choice?.kind === "quick" ? scale(choice.kcal) : scale(recipe?.kcal);

  const submit = () => {
    if (!choice) return;
    onLog({
      id: `log-${Date.now()}`,
      name,
      plannedMealId: choice.kind === "planned" ? choice.meal.id : undefined,
      recipeId: recipe?.id,
      portion,
      time,
      kcal,
      protein: scale(recipe?.protein),
      carbs: scale(recipe?.carbs),
      fat: scale(recipe?.fat),
      source: choice.kind === "quick" ? "user" : "calculated",
    });
  };

  const unlogged = plannedMeals.filter((m) => !m.logged);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={choice ? "How much did you eat?" : "Log a meal"}
      description={choice ? name : "Record what you actually ate — plans aren't counted until you do."}
      leading={choice && !preselect && <IconButton icon="chevronLeft" label="Back" onClick={() => setChoice(null)} />}
      footer={
        choice ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button icon="check" onClick={submit}>
              Log meal
            </Button>
          </>
        ) : source === "quick" ? (
          <Button
            disabled={!quickName.trim()}
            onClick={() => setChoice({ kind: "quick", name: quickName.trim(), kcal: quickKcal ? Number(quickKcal) : null })}
          >
            Continue
          </Button>
        ) : undefined
      }
    >
      {!choice ? (
        <div className="stack gap-5">
          <Segmented
            label="Log from"
            value={source}
            onChange={setSource}
            options={[
              { value: "plan", label: "Today's plan" },
              { value: "recipe", label: "Recipes" },
              { value: "quick", label: "Quick add" },
            ]}
          />

          {source === "plan" &&
            (unlogged.length ? (
              <ul className="recipe-list">
                {unlogged.map((m) => (
                  <li key={m.id}>
                    <button type="button" className="recipe-row" onClick={() => setChoice({ kind: "planned", meal: m })}>
                      <span className="recipe-row__thumb" aria-hidden="true">
                        <Icon name="calendar" size={18} />
                      </span>
                      <span className="stack recipe-row__text">
                        <span className="recipe-row__meta" style={{ textTransform: "capitalize" }}>
                          {m.slot} · {m.time}
                        </span>
                        <span className="recipe-row__name">{m.recipeName}</span>
                      </span>
                      <Icon name="chevronRight" size={18} className="subtle" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted recipe-list__empty">Everything planned for today is logged.</p>
            ))}

          {source === "recipe" && <RecipeList allowConflicts onSelect={(r) => setChoice({ kind: "recipe", recipe: r })} />}

          {source === "quick" && (
            <div className="stack gap-4">
              <Field label="What did you eat?">
                {(id) => (
                  <input
                    id={id}
                    className="input"
                    placeholder="e.g. Banana, café latte"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                  />
                )}
              </Field>
              <Field label="Calories (optional)" hint="Leave blank if you don't know — it'll show as missing, not zero.">
                {(id, hint) => (
                  <input
                    id={id}
                    className="input tabular"
                    inputMode="numeric"
                    aria-describedby={hint}
                    value={quickKcal}
                    onChange={(e) => setQuickKcal(e.target.value.replace(/\D/g, ""))}
                  />
                )}
              </Field>
            </div>
          )}
        </div>
      ) : (
        <div className="stack gap-6">
          {choice.kind === "planned" && choice.meal.servings > 1 && (
            <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
              Planned as {choice.meal.servings} servings for the household. Log only your share.
            </p>
          )}
          <div className="stack gap-3">
            <span className="toggle-row__label">Servings eaten</span>
            <div className="tiles" role="group" aria-label="Servings eaten">
              {portions.map((p) => (
                <button key={p} type="button" className="tile" aria-pressed={portion === p} onClick={() => setPortion(p)}>
                  {portionLabel(p)}
                  <small>{p === 1 ? "serving" : "servings"}</small>
                </button>
              ))}
            </div>
          </div>

          <Field label="Time">
            {(id) => <input id={id} type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />}
          </Field>

          <div className="estimate">
            <div className="row spread">
              <span className="toggle-row__label">Nutrition estimate</span>
              {kcal === null ? (
                <Badge tone="warning" icon="alert">
                  Incomplete
                </Badge>
              ) : (
                <Badge tone="info">{choice.kind === "quick" ? "Entered by you" : "Calculated"}</Badge>
              )}
            </div>
            {kcal === null ? (
              <p className="muted estimate__note">
                We don't have complete data for this food. It'll be logged without totals so your day isn't under‑counted
                as zero.
              </p>
            ) : (
              <div className="facts__row">
                <Est label="kcal" value={kcal} />
                <Est label="Protein" value={scale(recipe?.protein)} unit="g" />
                <Est label="Carbs" value={scale(recipe?.carbs)} unit="g" />
                <Est label="Fat" value={scale(recipe?.fat)} unit="g" />
              </div>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

function Est({ label, value, unit = "" }: { label: string; value: number | null; unit?: string }) {
  return (
    <div className="fact">
      <span className="fact__value tabular">{value === null ? "—" : `${value.toLocaleString()}${unit}`}</span>
      <span className="subtle fact__label">{label}</span>
    </div>
  );
}
