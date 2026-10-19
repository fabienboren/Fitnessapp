import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Icon, type IconName } from "../components/ui/Icon";
import { Badge, ProgressRing } from "../components/ui/primitives";
import { Logo } from "../components/layout/Logo";
import "./home.css";

const features: { icon: IconName; title: string; body: string }[] = [
  { icon: "calendar", title: "Weekly meal planner", body: "Drag recipes into a calendar, adjust servings and swap meals in a tap." },
  { icon: "cart", title: "One consolidated grocery list", body: "Ingredients merge across recipes with correct units. Your manual items stay put." },
  { icon: "book", title: "Recipes that fit you", body: "Filter by diet, allergens, prep time and what you already have." },
  { icon: "utensils", title: "Log what you actually ate", body: "Planned isn't eaten. Record real portions for honest daily totals." },
  { icon: "activity", title: "Activity & wellness", body: "Log workouts manually or import them, and see trends from real data." },
  { icon: "sparkles", title: "Optional AI assistant", body: "Suggests plans and swaps with reasons. Nothing changes until you approve." },
];

const steps = [
  { n: "01", title: "Tell us how you eat", body: "Diet, allergies, goals and your weekly rhythm. Two minutes, editable any time." },
  { n: "02", title: "Plan and shop", body: "Build a week of meals and get a grocery list that adds itself up." },
  { n: "03", title: "Track and adjust", body: "Log meals and movement. See progress based on what you recorded." },
];

const principles: { icon: IconName; title: string; body: string }[] = [
  { icon: "shield", title: "Your data, your call", body: "Optional integrations and AI processing are off until you opt in. Export or delete any time." },
  { icon: "info", title: "Honest numbers", body: "Every nutrition value shows its source. Missing data is flagged — never shown as zero." },
  { icon: "check", title: "You approve every change", body: "Suggestions are proposals. Your plan only changes when you say so." },
];

export function HomePage() {
  return (
    <div className="home">
      <header className="home-nav">
        <div className="home-container home-nav__inner">
          <Logo />
          <nav className="home-nav__links" aria-label="Main">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#privacy">Privacy</a>
          </nav>
          <div className="home-nav__cta">
            <Button to="/app" variant="ghost" size="sm">
              Sign in
            </Button>
            <Button to="/onboarding" size="sm">
              Get started
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="home-container hero__grid">
            <div className="hero__copy">
              <Badge tone="accent" icon="leaf">
                Meal planning · Groceries · Fitness
              </Badge>
              <h1 className="hero__title">Eat well without the spreadsheet.</h1>
              <p className="hero__lede">
                NutriFit plans your week, writes your grocery list and tracks what you actually eat and do — all in
                one calm, connected place.
              </p>
              <div className="hero__actions">
                <Button to="/onboarding" size="lg" iconRight="chevronRight">
                  Start planning — it's free
                </Button>
                <Button to="/app" size="lg" variant="secondary">
                  See the dashboard
                </Button>
              </div>
              <p className="hero__fine subtle">No AI, wearable or grocery integration required.</p>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="section">
          <div className="home-container">
            <div className="section__head">
              <p className="eyebrow">Everything connected</p>
              <h2 className="section__title">One plan drives everything else.</h2>
              <p className="section__lede muted">
                Your preferences shape your meals. Your meals shape your list. Your logs shape your progress.
              </p>
            </div>
            <div className="feature-grid">
              {features.map((f) => (
                <article key={f.title} className="feature">
                  <span className="feature__icon">
                    <Icon name={f.icon} />
                  </span>
                  <h3 className="feature__title">{f.title}</h3>
                  <p className="muted">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="section section--muted">
          <div className="home-container">
            <div className="section__head">
              <p className="eyebrow">How it works</p>
              <h2 className="section__title">Three steps to a calmer week.</h2>
            </div>
            <ol className="steps">
              {steps.map((s) => (
                <li key={s.n} className="step">
                  <span className="step__n tabular">{s.n}</span>
                  <h3 className="feature__title">{s.title}</h3>
                  <p className="muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Principles */}
        <section id="privacy" className="section">
          <div className="home-container">
            <div className="section__head">
              <p className="eyebrow">Built on trust</p>
              <h2 className="section__title">Helpful, never pushy.</h2>
            </div>
            <div className="principles">
              {principles.map((p) => (
                <div key={p.title} className="principle">
                  <Icon name={p.icon} size={22} />
                  <div className="stack gap-1">
                    <h3 className="feature__title">{p.title}</h3>
                    <p className="muted">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section">
          <div className="home-container">
            <div className="cta">
              <h2 className="section__title">Ready for an easier week?</h2>
              <p className="cta__lede">Set up your preferences and get a starting plan in minutes.</p>
              <Button to="/onboarding" size="lg" variant="secondary" iconRight="chevronRight">
                Create your account
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-container home-footer__inner">
          <Logo />
          <p className="subtle">General wellness guidance — not medical advice.</p>
          <nav className="home-footer__links" aria-label="Footer">
            <Link to="#">Privacy</Link>
            <Link to="#">Terms</Link>
            <Link to="#">Help</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Static product preview in the hero — a miniature of the dashboard. */
function HeroPreview() {
  return (
    <div className="preview" aria-hidden="true">
      <div className="preview__card preview__card--main">
        <div className="row spread">
          <div className="stack gap-1">
            <span className="eyebrow">Today</span>
            <strong>4 meals planned</strong>
          </div>
          <Badge tone="accent">2 logged</Badge>
        </div>
        <div className="preview__meals">
          {[
            ["Breakfast", "Overnight oats with berries", true],
            ["Lunch", "Lemon chickpea grain bowl", true],
            ["Dinner", "Miso salmon, rice & greens", false],
          ].map(([slot, name, done]) => (
            <div key={slot as string} className="preview__meal">
              <span className={`preview__dot ${done ? "is-done" : ""}`}>{done && <Icon name="check" size={12} />}</span>
              <div className="stack">
                <span className="subtle" style={{ fontSize: "var(--text-xs)" }}>
                  {slot}
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>{name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="preview__card preview__card--ring">
        <ProgressRing value={970} max={2100} size={96} stroke={8} label="Calories">
          <strong className="tabular">970</strong>
          <span className="subtle" style={{ fontSize: 11 }}>
            of 2,100
          </span>
        </ProgressRing>
      </div>
      <div className="preview__card preview__card--list">
        <Icon name="cart" size={18} />
        <div className="stack">
          <strong style={{ fontSize: "var(--text-sm)" }}>Grocery list</strong>
          <span className="subtle" style={{ fontSize: "var(--text-xs)" }}>
            24 items · 9 checked
          </span>
        </div>
      </div>
    </div>
  );
}
