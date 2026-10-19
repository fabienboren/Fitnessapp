import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Icon, type IconName } from "../components/ui/Icon";
import { Badge, ChoiceCard, Chip, Field, Segmented, Toggle } from "../components/ui/primitives";
import { Logo } from "../components/layout/Logo";
import { allergenOptions, dietOptions, dislikeOptions } from "../data/mock";
import "./onboarding.css";

type Goal = "eat_better" | "lose" | "muscle" | "save_time" | "maintain";
type Units = "metric" | "imperial";

interface Profile {
  firstName: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
  diet: string;
  allergens: string[];
  noAllergens: boolean;
  dislikes: string[];
  goal: Goal | null;
  activity: "low" | "moderate" | "high";
  mealsPerDay: "2" | "3" | "4";
  cookTime: "15" | "30" | "45";
  household: number;
  units: Units;
  consentAI: boolean;
  consentHealth: boolean;
  reminders: boolean;
}

const initial: Profile = {
  firstName: "",
  email: "",
  password: "",
  acceptedTerms: false,
  diet: "No preference",
  allergens: [],
  noAllergens: false,
  dislikes: [],
  goal: null,
  activity: "moderate",
  mealsPerDay: "3",
  cookTime: "30",
  household: 1,
  units: "metric",
  // Optional processing stays off until the user opts in.
  consentAI: false,
  consentHealth: false,
  reminders: false,
};

const goals: { value: Goal; icon: IconName; title: string; description: string }[] = [
  { value: "eat_better", icon: "leaf", title: "Eat more balanced meals", description: "More variety, more whole foods" },
  { value: "save_time", icon: "clock", title: "Save time on food", description: "Faster planning, prep and shopping" },
  { value: "lose", icon: "flame", title: "Manage my weight", description: "Steady, sustainable changes" },
  { value: "muscle", icon: "activity", title: "Support my training", description: "Fuel workouts and recovery" },
  { value: "maintain", icon: "check", title: "Keep doing what works", description: "Stay consistent and organised" },
];

const steps = ["Account", "Food", "Goals", "Routine", "Privacy"] as const;

const toggleIn = (list: string[], item: string) =>
  list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>(initial);
  const navigate = useNavigate();
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setP((prev) => ({ ...prev, [key]: value }));

  // Essentials the blueprint requires before a profile is usable.
  const blockers: Record<number, string | null> = {
    0: !p.firstName.trim()
      ? "Add your first name"
      : !/^\S+@\S+\.\S+$/.test(p.email)
        ? "Enter a valid email"
        : p.password.length < 8
          ? "Password needs at least 8 characters"
          : !p.acceptedTerms
            ? "Accept the terms to continue"
            : null,
    1: !p.noAllergens && p.allergens.length === 0 ? "Select your allergies, or confirm you have none" : null,
    2: !p.goal ? "Pick a goal — you can change it later" : null,
    3: null,
    4: null,
  };

  const done = step === steps.length;
  const blocker = blockers[step];
  const next = () => setStep((s) => Math.min(s + 1, steps.length));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="onb">
      <header className="onb__top">
        <Logo />
        {!done && (
          <Button variant="ghost" size="sm" onClick={() => navigate("/app")}>
            Save & finish later
          </Button>
        )}
      </header>

      {!done && (
        <div className="onb__progress">
          <ol className="stepper" aria-label="Onboarding progress">
            {steps.map((label, i) => (
              <li
                key={label}
                className={`stepper__item ${i < step ? "is-done" : ""} ${i === step ? "is-current" : ""}`}
                aria-current={i === step ? "step" : undefined}
              >
                <span className="stepper__bar" />
                <span className="stepper__label">{label}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <main className="onb__main">
        <div className="onb__panel" key={step}>
          {step === 0 && (
            <StepIntro eyebrow="Step 1 of 5" title="Create your account" lede="Your plan, list and logs stay private to you.">
              <div className="stack gap-4">
                <Field label="First name">
                  {(id) => (
                    <input
                      id={id}
                      className="input"
                      autoComplete="given-name"
                      value={p.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Email">
                  {(id) => (
                    <input
                      id={id}
                      type="email"
                      className="input"
                      autoComplete="email"
                      value={p.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Password" hint="At least 8 characters">
                  {(id, hint) => (
                    <input
                      id={id}
                      type="password"
                      className="input"
                      autoComplete="new-password"
                      aria-describedby={hint}
                      value={p.password}
                      onChange={(e) => set("password", e.target.value)}
                    />
                  )}
                </Field>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={p.acceptedTerms}
                    onChange={(e) => set("acceptedTerms", e.target.checked)}
                  />
                  <span>
                    I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
                  </span>
                </label>
              </div>
            </StepIntro>
          )}

          {step === 1 && (
            <StepIntro eyebrow="Step 2 of 5" title="How do you eat?" lede="We'll only suggest recipes that fit.">
              <Group label="Eating style">
                <div className="chips">
                  {dietOptions.map((d) => (
                    <Chip key={d} selected={p.diet === d} onToggle={() => set("diet", d)}>
                      {d}
                    </Chip>
                  ))}
                </div>
              </Group>

              <Group label="Allergies" required>
                <div className="chips">
                  {allergenOptions.map((a) => (
                    <Chip
                      key={a}
                      tone="danger"
                      selected={p.allergens.includes(a)}
                      onToggle={() => setP((prev) => ({ ...prev, allergens: toggleIn(prev.allergens, a), noAllergens: false }))}
                    >
                      {a}
                    </Chip>
                  ))}
                  <Chip
                    selected={p.noAllergens}
                    onToggle={() => setP((prev) => ({ ...prev, noAllergens: !prev.noAllergens, allergens: [] }))}
                  >
                    No known allergies
                  </Chip>
                </div>
                <p className="notice">
                  <Icon name="info" size={16} />
                  Recipes with unclear allergen information are flagged. Always check labels — we can't guarantee a food
                  is allergen‑free.
                </p>
              </Group>

              <Group label="Foods you'd rather skip" optional>
                <div className="chips">
                  {dislikeOptions.map((d) => (
                    <Chip key={d} selected={p.dislikes.includes(d)} onToggle={() => set("dislikes", toggleIn(p.dislikes, d))}>
                      {d}
                    </Chip>
                  ))}
                </div>
              </Group>
            </StepIntro>
          )}

          {step === 2 && (
            <StepIntro eyebrow="Step 3 of 5" title="What matters most right now?" lede="This shapes suggestions, not rules. Change it any time.">
              <div className="stack gap-3">
                {goals.map((g) => (
                  <ChoiceCard
                    key={g.value}
                    selected={p.goal === g.value}
                    onSelect={() => set("goal", g.value)}
                    icon={g.icon}
                    title={g.title}
                    description={g.description}
                  />
                ))}
              </div>
              <Group label="Typical activity level">
                <Segmented
                  label="Typical activity level"
                  value={p.activity}
                  onChange={(v) => set("activity", v)}
                  options={[
                    { value: "low", label: "Light" },
                    { value: "moderate", label: "Moderate" },
                    { value: "high", label: "Very active" },
                  ]}
                />
              </Group>
            </StepIntro>
          )}

          {step === 3 && (
            <StepIntro eyebrow="Step 4 of 5" title="Your weekly rhythm" lede="So plans fit real life, not an ideal week.">
              <Group label="Meals per day">
                <Segmented
                  label="Meals per day"
                  value={p.mealsPerDay}
                  onChange={(v) => set("mealsPerDay", v)}
                  options={[
                    { value: "2", label: "2" },
                    { value: "3", label: "3" },
                    { value: "4", label: "3 + snack" },
                  ]}
                />
              </Group>
              <Group label="Weeknight cooking time">
                <Segmented
                  label="Weeknight cooking time"
                  value={p.cookTime}
                  onChange={(v) => set("cookTime", v)}
                  options={[
                    { value: "15", label: "≤ 15 min" },
                    { value: "30", label: "~30 min" },
                    { value: "45", label: "45+ min" },
                  ]}
                />
              </Group>
              <Group label="Cooking for">
                <div className="stepper-input" role="group" aria-label="Number of people">
                  <button
                    type="button"
                    aria-label="Fewer people"
                    disabled={p.household <= 1}
                    onClick={() => set("household", p.household - 1)}
                  >
                    −
                  </button>
                  <output aria-live="polite" className="tabular">
                    {p.household} {p.household === 1 ? "person" : "people"}
                  </output>
                  <button
                    type="button"
                    aria-label="More people"
                    disabled={p.household >= 8}
                    onClick={() => set("household", p.household + 1)}
                  >
                    +
                  </button>
                </div>
              </Group>
              <Group label="Units">
                <Segmented
                  label="Units"
                  value={p.units}
                  onChange={(v) => set("units", v)}
                  options={[
                    { value: "metric", label: "Metric (g, ml)" },
                    { value: "imperial", label: "US (oz, cups)" },
                  ]}
                />
              </Group>
            </StepIntro>
          )}

          {step === 4 && (
            <StepIntro
              eyebrow="Step 5 of 5"
              title="You're in control"
              lede="These are optional. Everything core works without them."
            >
              <div className="card card--padded" style={{ paddingTop: 0, paddingBottom: 0 }}>
                <Toggle
                  label="AI meal suggestions"
                  description="Lets the assistant propose plans and swaps using your preferences. You approve every change."
                  checked={p.consentAI}
                  onChange={(v) => set("consentAI", v)}
                />
                <Toggle
                  label="Health platform import"
                  description="Import workouts from Apple Health or Health Connect. You'll choose exactly what to share."
                  checked={p.consentHealth}
                  onChange={(v) => set("consentHealth", v)}
                />
                <Toggle
                  label="Prep & meal reminders"
                  description="Gentle notifications based on your plan."
                  checked={p.reminders}
                  onChange={(v) => set("reminders", v)}
                />
              </div>
            </StepIntro>
          )}

          {done && <Finish profile={p} onContinue={() => navigate("/app")} />}
        </div>
      </main>

      {!done && (
        <footer className="onb__footer">
          <div className="onb__footer-inner">
            <Button variant="ghost" icon="chevronLeft" onClick={back} disabled={step === 0}>
              Back
            </Button>
            <div className="onb__footer-right">
              {blocker && (
                <span className="onb__blocker" role="status">
                  {blocker}
                </span>
              )}
              <Button onClick={next} disabled={!!blocker} iconRight="chevronRight">
                {step === steps.length - 1 ? "Finish" : "Continue"}
              </Button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function StepIntro({ eyebrow, title, lede, children }: { eyebrow: string; title: string; lede: string; children: ReactNode }) {
  return (
    <div className="stack gap-8">
      <div className="stack gap-2">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="onb__title">{title}</h1>
        <p className="muted onb__lede">{lede}</p>
      </div>
      {children}
    </div>
  );
}

function Group({ label, required, optional, children }: { label: string; required?: boolean; optional?: boolean; children: ReactNode }) {
  return (
    <fieldset className="group">
      <legend className="group__label">
        {label}
        {required && <Badge tone="neutral">Required</Badge>}
        {optional && <span className="subtle group__opt">Optional</span>}
      </legend>
      {children}
    </fieldset>
  );
}

function Finish({ profile, onContinue }: { profile: Profile; onContinue: () => void }) {
  const starters = [
    { name: "Lemon chickpea grain bowl", meta: "15 min · Vegetarian" },
    { name: "Sheet‑pan chicken & vegetables", meta: "30 min · High protein" },
    { name: "Overnight oats with berries", meta: "5 min · Make ahead" },
  ];
  return (
    <div className="stack gap-8 finish">
      <div className="finish__badge">
        <Icon name="check" size={28} />
      </div>
      <div className="stack gap-2">
        <h1 className="onb__title">You're all set, {profile.firstName || "friend"}.</h1>
        <p className="muted onb__lede">Here's a starting point based on your answers. Edit anything — nothing is locked in.</p>
      </div>

      <div className="stack gap-3">
        <p className="eyebrow">Recipes to try first</p>
        {starters.map((r) => (
          <div key={r.name} className="starter">
            <span className="starter__icon">
              <Icon name="utensils" size={18} />
            </span>
            <div className="stack">
              <strong>{r.name}</strong>
              <span className="subtle" style={{ fontSize: "var(--text-sm)" }}>
                {r.meta}
              </span>
            </div>
            <Icon name="chevronRight" className="subtle" style={{ marginLeft: "auto" }} />
          </div>
        ))}
      </div>

      <div className="stack gap-3">
        <Button size="lg" block onClick={onContinue}>
          Plan my first week
        </Button>
        <Button size="lg" block variant="ghost" onClick={onContinue}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
