import { useState } from "react";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { LogMealSheet, type MealLog } from "../components/flows/LogMealSheet";
import { LogActivitySheet } from "../components/flows/LogActivitySheet";
import { recipeById } from "../data/catalog";
import { Icon } from "../components/ui/Icon";
import { Badge, Card, CardHeader, ProgressBar, ProgressRing } from "../components/ui/primitives";
import {
  activityGoalMinutes,
  activityWeek,
  aiProposal,
  grocery,
  nextPrep,
  nutrition,
  todayMeals,
  user,
  type DayActivity,
  type PlannedMeal,
} from "../data/mock";
import "./dashboard.css";

const slotLabel: Record<PlannedMeal["slot"], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

/** Seed logs for the meals already marked as eaten in the sample data. */
const initialLogs: MealLog[] = todayMeals
  .filter((m) => m.logged)
  .map((m) => {
    const r = recipeById(m.recipeId);
    return {
      id: `log-${m.id}`,
      name: m.recipeName,
      plannedMealId: m.id,
      recipeId: r.id,
      portion: 1,
      time: m.time,
      kcal: r.kcal,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
      source: "calculated",
    };
  });

const sum = (logs: MealLog[], key: "kcal" | "protein" | "carbs" | "fat") =>
  logs.reduce((t, l) => t + (l[key] ?? 0), 0);

export function DashboardPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<MealLog[]>(initialLogs);
  const [activity, setActivity] = useState<DayActivity[]>(activityWeek);
  const [proposal, setProposal] = useState<"open" | "accepted" | "dismissed">("open");
  const [mealSheet, setMealSheet] = useState<{ open: boolean; preselect: PlannedMeal | null }>({ open: false, preselect: null });
  const [activityOpen, setActivityOpen] = useState(false);

  // A planned meal counts as eaten only when a log points at it.
  const meals = todayMeals.map((m) => ({ ...m, logged: logs.some((l) => l.plannedMealId === m.id) }));
  const extraLogs = logs.filter((l) => !l.plannedMealId);
  const loggedCount = meals.filter((m) => m.logged).length;
  const withData = logs.filter((l) => l.kcal !== null);
  const missingData = logs.length - withData.length;
  const kcalLogged = sum(withData, "kcal");
  const macros = nutrition.macros.map((m) => ({ ...m, grams: logs.length ? sum(withData, m.key) : null }));

  const unlog = (plannedMealId: string) => setLogs((l) => l.filter((x) => x.plannedMealId !== plannedMealId));

  const now = new Date();
  const today = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="dash">
      <header className="page-head">
        <div className="stack gap-1">
          <p className="subtle">{today}</p>
          <h1 className="page-title">{greeting}, {user.firstName}</h1>
        </div>
        <div className="page-head__actions">
          <Button variant="secondary" icon="activity" onClick={() => setActivityOpen(true)}>
            Log activity
          </Button>
          <Button icon="plus" onClick={() => setMealSheet({ open: true, preselect: null })}>
            Log a meal
          </Button>
        </div>
      </header>

      <div className="dash__grid">
        {/* Today's meals */}
        <Card className="dash__meals" aria-labelledby="meals-title">
          <CardHeader
            id="meals-title"
            title="Today's meals"
            subtitle={`${loggedCount} of ${meals.length} logged · planned meals are only counted once you log them`}
            action={
              <Button to="/app/plan" variant="ghost" size="sm" iconRight="chevronRight">
                Plan
              </Button>
            }
          />
          <ul className="meal-list">
            {meals.map((m) => (
              <li key={m.id} className="meal">
                <div className="meal__time tabular">{m.time}</div>
                <div className="meal__body">
                  <span className="meal__slot">{slotLabel[m.slot]}</span>
                  <span className="meal__name">{m.recipeName}</span>
                  <span className="meal__meta">
                    <Icon name="clock" size={14} /> {m.prepMinutes} min
                    <span aria-hidden="true">·</span>
                    {m.servings} {m.servings === 1 ? "serving" : "servings"}
                    <span aria-hidden="true">·</span>
                    {m.kcal === null ? (
                      <Badge tone="warning" icon="alert">
                        Nutrition incomplete
                      </Badge>
                    ) : (
                      <span className="tabular">~{m.kcal} kcal</span>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  className={`log-btn ${m.logged ? "is-logged" : ""}`}
                  aria-pressed={m.logged}
                  title={m.logged ? "Undo log" : undefined}
                  onClick={() => (m.logged ? unlog(m.id) : setMealSheet({ open: true, preselect: m }))}
                >
                  {m.logged ? <Icon name="check" size={16} /> : <Icon name="plus" size={16} />}
                  <span>{m.logged ? "Logged" : "Log"}</span>
                  <span className="sr-only"> {m.recipeName}</span>
                </button>
              </li>
            ))}
            {extraLogs.map((l) => (
              <li key={l.id} className="meal">
                <div className="meal__time tabular">{l.time}</div>
                <div className="meal__body">
                  <span className="meal__slot">Not planned</span>
                  <span className="meal__name">{l.name}</span>
                  <span className="meal__meta">
                    {l.portion} {l.portion === 1 ? "serving" : "servings"}
                    <span aria-hidden="true">·</span>
                    {l.kcal === null ? (
                      <Badge tone="warning" icon="alert">
                        No nutrition data
                      </Badge>
                    ) : (
                      <span className="tabular">~{l.kcal} kcal</span>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  className="log-btn is-logged"
                  aria-pressed
                  title="Undo log"
                  onClick={() => setLogs((list) => list.filter((x) => x.id !== l.id))}
                >
                  <Icon name="check" size={16} />
                  <span>Logged</span>
                  <span className="sr-only"> {l.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* Nutrition */}
        <Card className="dash__nutrition" aria-labelledby="nutrition-title">
          <CardHeader
            id="nutrition-title"
            title="Nutrition"
            subtitle="From logged meals only"
            action={<Badge tone="info">Estimated</Badge>}
          />
          <div className="nutrition">
            <ProgressRing value={kcalLogged} max={nutrition.kcalTarget} label="Calories logged vs target">
              <span className="ring-value tabular">{kcalLogged.toLocaleString()}</span>
              <span className="subtle ring-caption tabular">of {nutrition.kcalTarget.toLocaleString()} kcal</span>
            </ProgressRing>
            <ul className="macros">
              {macros.map((m) => (
                <li key={m.key} className="macro">
                  <div className="row spread">
                    <span className="row gap-2 macro__label">
                      <span className="macro__dot" style={{ background: m.color }} />
                      {m.label}
                    </span>
                    <span className="tabular subtle macro__value">
                      {m.grams === null ? "—" : `${m.grams}g`} / {m.target}g
                    </span>
                  </div>
                  <ProgressBar value={m.grams ?? 0} max={m.target} color={m.color} label={`${m.label} logged`} />
                </li>
              ))}
            </ul>
          </div>
          <p className="footnote">
            <Icon name="info" size={14} />
            {missingData > 0
              ? `${missingData} logged ${missingData === 1 ? "item has" : "items have"} no nutrition data and ${missingData === 1 ? "isn't" : "aren't"} included.`
              : "Calculated from recipe data for the meals you've logged."}
          </p>
        </Card>

        {/* AI proposal */}
        {proposal !== "dismissed" && (
          <Card className="dash__ai proposal" aria-labelledby="ai-title">
            <div className="proposal__head">
              <span className="proposal__icon">
                <Icon name="sparkles" size={18} />
              </span>
              <Badge tone={proposal === "accepted" ? "accent" : "neutral"}>
                {proposal === "accepted" ? "Applied to your plan" : "Suggestion · needs your approval"}
              </Badge>
            </div>
            <h2 id="ai-title" className="proposal__title">
              {aiProposal.title}
            </h2>
            <p className="muted proposal__reason">{aiProposal.reason}</p>
            {proposal === "open" && (
              <div className="row gap-2">
                <Button size="sm" onClick={() => setProposal("accepted")}>
                  Apply swap
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setProposal("dismissed")}>
                  Dismiss
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Next prep */}
        <Card className="dash__prep" aria-labelledby="prep-title">
          <CardHeader id="prep-title" title="Next prep task" />
          <div className="prep">
            <span className="prep__icon">
              <Icon name="utensils" />
            </span>
            <div className="stack gap-1">
              <strong>{nextPrep.title}</strong>
              <span className="muted prep__meta">
                {nextPrep.due} · {nextPrep.minutes} min · for {nextPrep.forMeal}
              </span>
            </div>
          </div>
        </Card>

        {/* Activity */}
        <Card className="dash__activity" aria-labelledby="activity-title">
          <ActivityCard days={activity} />
        </Card>

        {/* Groceries */}
        <Card className="dash__grocery" aria-labelledby="grocery-title">
          <CardHeader
            id="grocery-title"
            title="Grocery list"
            subtitle={grocery.listName}
            action={
              <Button to="/app/groceries" variant="ghost" size="sm" iconRight="chevronRight">
                Open
              </Button>
            }
          />
          <div className="stack gap-3">
            <div className="row spread">
              <span className="stat tabular">
                {grocery.checked}
                <span className="subtle stat__of"> / {grocery.total} items</span>
              </span>
            </div>
            <ProgressBar value={grocery.checked} max={grocery.total} label="Grocery items checked" />
            {grocery.unresolved > 0 && (
              <p className="footnote footnote--warning">
                <Icon name="alert" size={14} /> {grocery.unresolved} quantities couldn't be combined — review units
              </p>
            )}
          </div>
        </Card>
      </div>

      <LogMealSheet
        open={mealSheet.open}
        preselect={mealSheet.preselect}
        plannedMeals={meals}
        onClose={() => setMealSheet({ open: false, preselect: null })}
        onLog={(log) => {
          setLogs((l) => [...l, log]);
          setMealSheet({ open: false, preselect: null });
          toast({ message: `Logged ${log.name}` });
        }}
      />
      <LogActivitySheet
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        onLog={(a) => {
          // The last entry is today.
          setActivity((days) => days.map((d, i) => (i === days.length - 1 ? { ...d, minutes: (d.minutes ?? 0) + a.minutes } : d)));
          setActivityOpen(false);
          toast({ message: `Logged ${a.minutes} min of activity`, action: { label: "See trends", to: "/app/progress" } });
        }}
      />
    </div>
  );
}

/** Last seven days, oldest first, ending today. */
function ActivityCard({ days }: { days: DayActivity[] }) {
  const logged = days.reduce((sum, d) => sum + (d.minutes ?? 0), 0);
  const missingDays = days.filter((d) => d.minutes === null).length;
  const peak = Math.max(...days.map((d) => d.minutes ?? 0), 1);
  const label = (i: number) => {
    const d = new Date();
    d.setDate(d.getDate() - (days.length - 1 - i));
    return d.toLocaleDateString(undefined, { weekday: "short" });
  };

  return (
    <>
      <CardHeader
        id="activity-title"
        title="Activity · last 7 days"
        subtitle={`${logged} of ${activityGoalMinutes} min goal`}
        action={
          <Button to="/app/progress" variant="ghost" size="sm" iconRight="chevronRight">
            Trends
          </Button>
        }
      />
      <div className="week" role="list" aria-label="Logged activity minutes per day">
        {days.map((d, i) => (
          <div
            key={i}
            role="listitem"
            className={`week__col ${i === days.length - 1 ? "is-today" : ""}`}
            aria-label={d.minutes === null ? `${label(i)}: nothing logged` : `${label(i)}: ${d.minutes} minutes`}
          >
            <div className="week__track">
              {d.minutes === null ? (
                <div className="week__empty" />
              ) : (
                <div className="week__bar" style={{ height: `${(d.minutes / peak) * 100}%` }} />
              )}
            </div>
            <span className="week__day">{i === days.length - 1 ? "Today" : label(i).slice(0, 1)}</span>
          </div>
        ))}
      </div>
      {missingDays > 0 && (
        <p className="footnote">
          <Icon name="info" size={14} /> {missingDays} {missingDays === 1 ? "day" : "days"} with nothing logged — shown as gaps, not zero.
        </p>
      )}
    </>
  );
}
