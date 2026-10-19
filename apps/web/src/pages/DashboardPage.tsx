import { useState } from "react";
import { Button } from "../components/ui/Button";
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
  type PlannedMeal,
} from "../data/mock";
import "./dashboard.css";

const slotLabel: Record<PlannedMeal["slot"], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export function DashboardPage() {
  const [meals, setMeals] = useState(todayMeals);
  const [proposal, setProposal] = useState<"open" | "accepted" | "dismissed">("open");

  const loggedCount = meals.filter((m) => m.logged).length;
  const toggleLogged = (id: string) =>
    setMeals((ms) => ms.map((m) => (m.id === id ? { ...m, logged: !m.logged } : m)));

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
          <Button variant="secondary" icon="activity">
            Log activity
          </Button>
          <Button icon="plus">Log a meal</Button>
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
                  onClick={() => toggleLogged(m.id)}
                >
                  {m.logged ? <Icon name="check" size={16} /> : <Icon name="plus" size={16} />}
                  <span>{m.logged ? "Logged" : "Log"}</span>
                  <span className="sr-only"> {m.recipeName}</span>
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
            <ProgressRing value={nutrition.kcalLogged} max={nutrition.kcalTarget} label="Calories logged vs target">
              <span className="ring-value tabular">{nutrition.kcalLogged.toLocaleString()}</span>
              <span className="subtle ring-caption tabular">of {nutrition.kcalTarget.toLocaleString()} kcal</span>
            </ProgressRing>
            <ul className="macros">
              {nutrition.macros.map((m) => (
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
            <Icon name="info" size={14} /> Values are calculated from recipe data. Snack excluded until logged.
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
          <ActivityCard />
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
    </div>
  );
}

function ActivityCard() {
  const logged = activityWeek.reduce((sum, d) => sum + (d.minutes ?? 0), 0);
  const missingDays = activityWeek.filter((d) => d.minutes === null).length;
  const peak = Math.max(...activityWeek.map((d) => d.minutes ?? 0), 1);

  return (
    <>
      <CardHeader
        id="activity-title"
        title="Activity this week"
        subtitle={`${logged} of ${activityGoalMinutes} min goal`}
        action={
          <Button to="/app/progress" variant="ghost" size="sm" iconRight="chevronRight">
            Trends
          </Button>
        }
      />
      <div className="week" role="list" aria-label="Logged activity minutes per day">
        {activityWeek.map((d) => (
          <div
            key={d.day}
            role="listitem"
            className="week__col"
            aria-label={d.minutes === null ? `${d.day}: nothing logged` : `${d.day}: ${d.minutes} minutes`}
          >
            <div className="week__track">
              {d.minutes === null ? (
                <div className="week__empty" />
              ) : (
                <div className="week__bar" style={{ height: `${(d.minutes / peak) * 100}%` }} />
              )}
            </div>
            <span className="week__day">{d.day.slice(0, 1)}</span>
          </div>
        ))}
      </div>
      {missingDays > 0 && (
        <p className="footnote">
          <Icon name="info" size={14} /> {missingDays} days with nothing logged — shown as gaps, not zero.
        </p>
      )}
    </>
  );
}
