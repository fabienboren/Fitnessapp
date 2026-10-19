import { useMemo, useState } from "react";
import { Button, IconButton } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Badge, Chip, Segmented, Toggle } from "../components/ui/primitives";
import { Sheet } from "../components/ui/Sheet";
import { useToast } from "../components/ui/Toast";
import { RecipePicker } from "../components/flows/RecipePicker";
import { ServingsStepper } from "../components/flows/ServingsStepper";
import { RecipeFacts } from "../components/flows/RecipeFacts";
import {
  aiProposal,
  conflictsWithUser,
  initialPlan,
  planSlots,
  recipeById,
  userAllergens,
  type PlanEntry,
  type WeekPlan,
} from "../data/catalog";
import type { MealSlot } from "../data/mock";
import "./dashboard.css";
import "./plan.css";

const slotLabel: Record<MealSlot, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

function weekDays(offset: number) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString(undefined, o);

type Target = { day: number; slot: MealSlot };

const emptyPlan: WeekPlan = { 0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };
type SaveState = "draft" | "saved";

export function PlanPage() {
  const toast = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  // Plans and save status are per week; only the current week has sample data.
  const [plans, setPlans] = useState<Record<number, WeekPlan>>({ 0: initialPlan });
  const [statuses, setStatuses] = useState<Record<number, SaveState>>({});
  const [selectedDay, setSelectedDay] = useState(() => (new Date().getDay() + 6) % 7);

  const [pickerFor, setPickerFor] = useState<Target | null>(null);
  const [editing, setEditing] = useState<Target | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);

  const days = weekDays(weekOffset);
  const plan = plans[weekOffset] ?? emptyPlan;
  const status = statuses[weekOffset] ?? "draft";
  const setStatus = (st: SaveState) => setStatuses((prev) => ({ ...prev, [weekOffset]: st }));
  const todayIndex = weekOffset === 0 ? (new Date().getDay() + 6) % 7 : -1;

  const entries = useMemo(
    () =>
      Object.entries(plan).flatMap(([day, slots]) =>
        Object.entries(slots).map(([slot, e]) => ({ day: Number(day), slot: slot as MealSlot, entry: e as PlanEntry })),
      ),
    [plan],
  );
  const proposed = entries.filter((e) => e.entry.proposed);
  const approved = entries.filter((e) => !e.entry.proposed);
  const flagged = proposed.filter((e) => e.entry.warning);
  const totalSlots = 7 * planSlots.length;

  const update = (fn: (p: WeekPlan) => void) => {
    setPlans((prev) => {
      const next: WeekPlan = structuredClone(prev[weekOffset] ?? emptyPlan);
      fn(next);
      return { ...prev, [weekOffset]: next };
    });
    setStatus("draft");
  };

  const setEntry = (t: Target, entry: PlanEntry | null) =>
    update((p) => {
      if (entry) p[t.day][t.slot] = entry;
      else delete p[t.day][t.slot];
    });

  const acceptAllSafe = () =>
    update((p) => {
      proposed.filter((e) => !e.entry.warning).forEach(({ day, slot }) => delete p[day][slot]!.proposed);
    });
  const discardAll = () => update((p) => proposed.forEach(({ day, slot }) => delete p[day][slot]));

  const generate = () => {
    setSuggestOpen(false);
    setGenerating(true);
    window.setTimeout(() => {
      update((p) => {
        aiProposal.forEach(({ day, slot, entry }) => {
          if (!p[day][slot]) p[day][slot] = { ...entry };
        });
      });
      setGenerating(false);
    }, 900);
  };

  const save = () => {
    setCheckOpen(false);
    setStatus("saved");
    toast({ message: "Plan saved", action: { label: "Update grocery list", to: "/app/groceries" } });
  };

  const editingEntry = editing ? plan[editing.day][editing.slot] : undefined;

  return (
    <div className="plan">
      <header className="page-head">
        <div className="stack gap-2">
          <div className="row gap-2">
            <h1 className="page-title">Meal plan</h1>
            <Badge tone={status === "saved" ? "accent" : "neutral"}>{status === "saved" ? "Saved" : "Draft"}</Badge>
          </div>
          <div className="week-nav">
            <IconButton icon="chevronLeft" label="Previous week" onClick={() => setWeekOffset((w) => w - 1)} />
            <span className="week-nav__label tabular">
              {fmt(days[0], { month: "short", day: "numeric" })} – {fmt(days[6], { month: "short", day: "numeric" })}
            </span>
            <IconButton icon="chevronRight" label="Next week" onClick={() => setWeekOffset((w) => w + 1)} />
          </div>
        </div>
        <div className="page-head__actions">
          <Button variant="secondary" icon="sparkles" onClick={() => setSuggestOpen(true)} disabled={generating}>
            {generating ? "Suggesting…" : "Suggest meals"}
          </Button>
          <Button icon="check" onClick={() => setCheckOpen(true)} disabled={proposed.length > 0 || status === "saved"}>
            Save plan
          </Button>
        </div>
      </header>

      {/* Summary */}
      <div className="plan-summary">
        <div className="plan-summary__stat">
          <span className="plan-summary__value tabular">
            {approved.length}
            <span className="subtle">/{totalSlots}</span>
          </span>
          <span className="subtle">meals planned</span>
        </div>
        <div className="plan-summary__stat">
          <span className="plan-summary__value tabular">
            {new Set(approved.map((e) => e.entry.recipeId)).size}
          </span>
          <span className="subtle">recipes</span>
        </div>
        <div className="plan-summary__stat">
          <span className="plan-summary__value tabular">{userAllergens.length}</span>
          <span className="subtle">allergen filter on</span>
        </div>
      </div>

      {/* Proposal review banner */}
      {proposed.length > 0 && (
        <div className="review-banner" role="region" aria-label="Suggestions to review">
          <span className="review-banner__icon">
            <Icon name="sparkles" size={18} />
          </span>
          <div className="stack gap-1 review-banner__text">
            <strong>
              {proposed.length} suggested {proposed.length === 1 ? "meal" : "meals"} to review
            </strong>
            <span className="muted">
              Suggestions aren't part of your plan until you accept them.
              {flagged.length > 0 && ` ${flagged.length} needs a closer look and must be accepted individually.`}
            </span>
          </div>
          <div className="review-banner__actions">
            <Button size="sm" variant="ghost" onClick={discardAll}>
              Discard all
            </Button>
            <Button size="sm" onClick={acceptAllSafe} disabled={proposed.length === flagged.length}>
              Accept {proposed.length - flagged.length}
            </Button>
          </div>
        </div>
      )}

      {/* Day strip (mobile/tablet) */}
      <div className="day-strip" role="tablist" aria-label="Day">
        {days.map((d, i) => {
          const count = planSlots.filter((s) => plan[i][s] && !plan[i][s]!.proposed).length;
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={selectedDay === i}
              className={`day-strip__day ${i === todayIndex ? "is-today" : ""}`}
              onClick={() => setSelectedDay(i)}
            >
              <span className="day-strip__dow">{fmt(d, { weekday: "short" })}</span>
              <span className="day-strip__num tabular">{d.getDate()}</span>
              <span className="day-strip__dots" aria-label={`${count} of 3 meals planned`}>
                {planSlots.map((s, j) => (
                  <span key={s} className={j < count ? "is-on" : ""} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* Week grid (desktop) + single day (mobile) share one renderer */}
      <div className="week-grid">
        {days.map((d, i) => (
          <section
            key={i}
            className={`day-col ${i === selectedDay ? "is-selected" : ""} ${i === todayIndex ? "is-today" : ""}`}
            aria-label={fmt(d, { weekday: "long", month: "long", day: "numeric" })}
          >
            <header className="day-col__head">
              <span className="day-col__dow">{fmt(d, { weekday: "short" })}</span>
              <span className="day-col__num tabular">{d.getDate()}</span>
            </header>
            <div className="day-col__slots">
              {planSlots.map((slot) => {
                const e = plan[i][slot];
                const target = { day: i, slot };
                if (!e) {
                  return (
                    <button key={slot} type="button" className="slot slot--empty" onClick={() => setPickerFor(target)}>
                      <span className="slot__label">{slotLabel[slot]}</span>
                      <span className="slot__add">
                        <Icon name="plus" size={16} /> Add
                      </span>
                    </button>
                  );
                }
                const r = recipeById(e.recipeId);
                return (
                  <button
                    key={slot}
                    type="button"
                    className={`slot ${e.proposed ? "slot--proposed" : ""} ${e.warning ? "slot--warning" : ""}`}
                    onClick={() => setEditing(target)}
                  >
                    <span className="slot__label">
                      {slotLabel[slot]}
                      {e.proposed && <Icon name={e.warning ? "alert" : "sparkles"} size={12} />}
                    </span>
                    <span className="slot__name">{r.name}</span>
                    <span className="slot__meta tabular">
                      {r.minutes} min · {e.servings}×
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* ---------- Sheets ---------- */}

      <RecipePicker
        open={!!pickerFor}
        title={pickerFor ? `Add ${slotLabel[pickerFor.slot].toLowerCase()} · ${fmt(days[pickerFor.day], { weekday: "long" })}` : ""}
        confirmLabel="Add to plan"
        onClose={() => setPickerFor(null)}
        onConfirm={(recipeId, servings) => {
          setEntry(pickerFor!, { recipeId, servings });
          setPickerFor(null);
        }}
      />

      <Sheet
        open={!!editing && !!editingEntry}
        onClose={() => setEditing(null)}
        title={editingEntry ? recipeById(editingEntry.recipeId).name : ""}
        description={
          editing && `${slotLabel[editing.slot]} · ${fmt(days[editing.day], { weekday: "long", month: "short", day: "numeric" })}`
        }
        footer={
          editingEntry?.proposed ? (
            <>
              <Button variant="ghost" onClick={() => (setEntry(editing!, null), setEditing(null))}>
                Reject
              </Button>
              <Button
                icon="check"
                onClick={() => {
                  setEntry(editing!, { recipeId: editingEntry.recipeId, servings: editingEntry.servings });
                  setEditing(null);
                }}
              >
                {editingEntry.warning ? "I've checked — accept" : "Accept"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="danger" icon="trash" onClick={() => (setEntry(editing!, null), setEditing(null))}>
                Remove
              </Button>
              <Button onClick={() => setEditing(null)}>Done</Button>
            </>
          )
        }
      >
        {editingEntry && editing && (
          <div className="stack gap-6">
            {editingEntry.proposed && (
              <div className={`notice ${editingEntry.warning ? "notice--warning" : ""}`}>
                <Icon name={editingEntry.warning ? "alert" : "sparkles"} size={16} />
                <span>
                  {editingEntry.warning ??
                    "Suggested because it fits your prep time and reuses ingredients already in this week's plan."}
                </span>
              </div>
            )}
            <RecipeFacts recipeId={editingEntry.recipeId} servings={editingEntry.servings} />
            <div className="row spread">
              <span className="toggle-row__label">Servings</span>
              <ServingsStepper
                value={editingEntry.servings}
                onChange={(servings) => setEntry(editing, { ...editingEntry, servings })}
              />
            </div>
            <Button
              variant="secondary"
              icon="calendar"
              onClick={() => {
                setPickerFor(editing);
                setEditing(null);
              }}
            >
              Swap for another recipe
            </Button>
          </div>
        )}
      </Sheet>

      <SuggestSheet open={suggestOpen} onClose={() => setSuggestOpen(false)} onGenerate={generate} />

      <Sheet
        open={checkOpen}
        onClose={() => setCheckOpen(false)}
        title="Check your plan"
        description="We validate the plan before saving it."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCheckOpen(false)}>
              Keep editing
            </Button>
            <Button icon="check" onClick={save}>
              Save plan
            </Button>
          </>
        }
      >
        <ul className="checks">
          <CheckRow ok title="All recipes found" detail={`${approved.length} meals reference valid recipes`} />
          <CheckRow
            ok={approved.every((e) => conflictsWithUser(recipeById(e.entry.recipeId)).length === 0)}
            title="No conflicts with your allergies"
            detail={`Checked against: ${userAllergens.join(", ")}`}
          />
          <CheckRow
            ok={approved.every((e) => e.entry.servings > 0)}
            title="Servings set for every meal"
            detail="Used to scale your grocery list"
          />
          <CheckRow
            ok={approved.every((e) => recipeById(e.entry.recipeId).kcal !== null)}
            warn
            title="Nutrition data"
            detail={
              approved.some((e) => recipeById(e.entry.recipeId).kcal === null)
                ? "Some recipes have incomplete nutrition — totals will show gaps"
                : "Complete for all planned recipes"
            }
          />
          <CheckRow
            ok={approved.length === totalSlots}
            warn
            title={`${totalSlots - approved.length} open slots`}
            detail="That's fine — plan as much or as little as you like"
          />
        </ul>
      </Sheet>
    </div>
  );
}

function CheckRow({ ok, warn, title, detail }: { ok: boolean; warn?: boolean; title: string; detail: string }) {
  const tone = ok ? "ok" : warn ? "warn" : "fail";
  return (
    <li className={`check-row check-row--${tone}`}>
      <span className="check-row__icon">
        <Icon name={ok ? "check" : warn ? "info" : "alert"} size={14} />
      </span>
      <div className="stack">
        <strong>{title}</strong>
        <span className="muted">{detail}</span>
      </div>
    </li>
  );
}

function SuggestSheet({ open, onClose, onGenerate }: { open: boolean; onClose: () => void; onGenerate: () => void }) {
  const [slots, setSlots] = useState<MealSlot[]>(["lunch", "dinner"]);
  const [time, setTime] = useState<"15" | "30" | "45">("30");
  const [reuse, setReuse] = useState(true);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Suggest meals"
      description="Fills empty slots only. You'll review every suggestion before it's added."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button icon="sparkles" onClick={onGenerate} disabled={slots.length === 0}>
            Get suggestions
          </Button>
        </>
      }
    >
      <div className="stack gap-6">
        <div className="stack gap-3">
          <span className="toggle-row__label">Which meals?</span>
          <div className="chips">
            {planSlots.map((s) => (
              <Chip
                key={s}
                selected={slots.includes(s)}
                onToggle={() => setSlots((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]))}
              >
                {slotLabel[s]}
              </Chip>
            ))}
          </div>
        </div>
        <div className="stack gap-3">
          <span className="toggle-row__label">Max cooking time</span>
          <Segmented
            label="Max cooking time"
            value={time}
            onChange={setTime}
            options={[
              { value: "15", label: "15 min" },
              { value: "30", label: "30 min" },
              { value: "45", label: "45 min" },
            ]}
          />
        </div>
        <div>
          <Toggle
            label="Reuse ingredients"
            description="Prefer recipes that share ingredients to reduce waste."
            checked={reuse}
            onChange={setReuse}
          />
        </div>
        <div className="notice">
          <Icon name="shield" size={16} />
          <span>
            Uses your diet, allergies ({userAllergens.join(", ")}) and schedule. Recipes with unresolved allergen data are
            flagged, never added silently.
          </span>
        </div>
      </div>
    </Sheet>
  );
}
