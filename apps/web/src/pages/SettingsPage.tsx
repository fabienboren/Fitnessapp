import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Badge, Card, Chip, Field, Segmented, Toggle } from "../components/ui/primitives";
import { allergenOptions, dietOptions, integrations, user } from "../data/mock";
import "./settings.css";

const sections = [
  { id: "profile", label: "Profile" },
  { id: "food", label: "Food preferences" },
  { id: "goals", label: "Goals & targets" },
  { id: "preferences", label: "Units & appearance" },
  { id: "notifications", label: "Notifications" },
  { id: "integrations", label: "Integrations" },
  { id: "privacy", label: "Privacy & data" },
  { id: "account", label: "Account" },
];

type Theme = "system" | "light" | "dark";

export function SettingsPage() {
  const { hash } = useLocation();
  const [active, setActive] = useState(sections[0].id);

  const [diet, setDiet] = useState("Vegetarian");
  const [allergens, setAllergens] = useState<string[]>(["Peanuts"]);
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.dataset.theme as Theme | undefined) ?? "system",
  );
  const [notify, setNotify] = useState({ prep: true, log: false, weekly: true, grocery: false });
  const [consent, setConsent] = useState({ ai: true, health: false, analytics: false });
  const [confirmDelete, setConfirmDelete] = useState("");

  // Deep links like /app/settings#privacy
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  // Highlight the section currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="settings">
      <header className="page-head">
        <h1 className="page-title">Settings</h1>
      </header>

      <div className="settings__layout">
        <nav className="settings__nav" aria-label="Settings sections">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="settings__navlink" aria-current={active === s.id ? "true" : undefined}>
              {s.label}
            </a>
          ))}
        </nav>

        <div className="settings__body">
          <Section id="profile" title="Profile" description="How you appear in the app.">
            <div className="profile-row">
              <span className="avatar avatar--xl">{user.initials}</span>
              <Button variant="secondary" size="sm">
                Change photo
              </Button>
            </div>
            <div className="form-grid">
              <Field label="First name">{(id) => <input id={id} className="input" defaultValue={user.firstName} />}</Field>
              <Field label="Email">{(id) => <input id={id} type="email" className="input" defaultValue={user.email} />}</Field>
              <Field label="Time zone" hint="Used for meal times and reminders">
                {(id, hint) => (
                  <select id={id} className="select" aria-describedby={hint} defaultValue="Europe/Paris">
                    <option value="Europe/Paris">Europe/Paris (CET)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="America/New_York">America/New_York (ET)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
                  </select>
                )}
              </Field>
            </div>
          </Section>

          <Section id="food" title="Food preferences" description="Applied to recipe search, plans and suggestions.">
            <SubLabel>Eating style</SubLabel>
            <div className="chips">
              {dietOptions.map((d) => (
                <Chip key={d} selected={diet === d} onToggle={() => setDiet(d)}>
                  {d}
                </Chip>
              ))}
            </div>
            <SubLabel>Allergies</SubLabel>
            <div className="chips">
              {allergenOptions.map((a) => (
                <Chip
                  key={a}
                  tone="danger"
                  selected={allergens.includes(a)}
                  onToggle={() => setAllergens((l) => (l.includes(a) ? l.filter((x) => x !== a) : [...l, a]))}
                >
                  {a}
                </Chip>
              ))}
            </div>
            <p className="notice">
              <Icon name="info" size={16} />
              Recipes with missing allergen data are flagged, not hidden. Always check product labels.
            </p>
          </Section>

          <Section id="goals" title="Goals & targets" description="Targets are guides for your dashboard, not prescriptions.">
            <div className="form-grid">
              <Field label="Primary goal">
                {(id) => (
                  <select id={id} className="select" defaultValue="eat_better">
                    <option value="eat_better">Eat more balanced meals</option>
                    <option value="save_time">Save time on food</option>
                    <option value="lose">Manage my weight</option>
                    <option value="muscle">Support my training</option>
                    <option value="maintain">Keep doing what works</option>
                  </select>
                )}
              </Field>
              <Field label="Daily energy target (kcal)" hint="Leave blank to hide calorie targets">
                {(id, hint) => <input id={id} className="input tabular" inputMode="numeric" aria-describedby={hint} defaultValue="2100" />}
              </Field>
              <Field label="Weekly activity goal (min)">
                {(id) => <input id={id} className="input tabular" inputMode="numeric" defaultValue="150" />}
              </Field>
            </div>
          </Section>

          <Section id="preferences" title="Units & appearance">
            <Row label="Measurement units">
              <Segmented
                label="Measurement units"
                value={units}
                onChange={setUnits}
                options={[
                  { value: "metric", label: "Metric" },
                  { value: "imperial", label: "US" },
                ]}
              />
            </Row>
            <Row label="Theme">
              <Segmented
                label="Theme"
                value={theme}
                onChange={setTheme}
                options={[
                  { value: "system", label: "System" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
            </Row>
          </Section>

          <Section id="notifications" title="Notifications">
            <Toggle label="Prep reminders" description="Before meals that need advance prep." checked={notify.prep} onChange={(v) => setNotify({ ...notify, prep: v })} />
            <Toggle label="Meal logging nudges" description="A gentle reminder after planned meal times." checked={notify.log} onChange={(v) => setNotify({ ...notify, log: v })} />
            <Toggle label="Weekly summary" description="Sunday recap of your plan and logs." checked={notify.weekly} onChange={(v) => setNotify({ ...notify, weekly: v })} />
            <Toggle label="Grocery day reminder" checked={notify.grocery} onChange={(v) => setNotify({ ...notify, grocery: v })} />
          </Section>

          <Section id="integrations" title="Integrations" description="Connect only what you need. Disconnecting stops future syncs.">
            <ul className="integrations">
              {integrations.map((i) => (
                <li key={i.id} className="integration">
                  <span className="integration__icon">
                    <Icon name="link" size={18} />
                  </span>
                  <div className="stack integration__text">
                    <strong>{i.name}</strong>
                    <span className="muted">{i.description}</span>
                  </div>
                  {i.status === "connected" && <Badge tone="accent">Connected</Badge>}
                  {i.status === "not_connected" && (
                    <Button variant="secondary" size="sm">
                      Connect
                    </Button>
                  )}
                  {i.status === "unavailable" && <Badge>Unavailable here</Badge>}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="privacy" title="Privacy & data" description="Optional processing you've agreed to. Change it any time.">
            <Toggle
              label="AI assistance"
              description="Sends only the preferences needed for a request. Suggestions always need your approval."
              checked={consent.ai}
              onChange={(v) => setConsent({ ...consent, ai: v })}
            />
            <Toggle
              label="Health data import"
              description="Allows connected health platforms to share activity records."
              checked={consent.health}
              onChange={(v) => setConsent({ ...consent, health: v })}
            />
            <Toggle
              label="Product analytics"
              description="Anonymous usage data to improve the app. Never includes food or health logs."
              checked={consent.analytics}
              onChange={(v) => setConsent({ ...consent, analytics: v })}
            />
            <div className="data-actions">
              <div className="stack gap-1">
                <strong className="data-actions__title">Export your data</strong>
                <span className="muted data-actions__desc">Profile, plans, lists and logs as JSON and CSV.</span>
              </div>
              <Button variant="secondary" size="sm" icon="download">
                Request export
              </Button>
            </div>
          </Section>

          <Section id="account" title="Account">
            <div className="data-actions">
              <div className="stack gap-1">
                <strong className="data-actions__title">Sign out</strong>
                <span className="muted data-actions__desc">Sign out on this device.</span>
              </div>
              <Button variant="secondary" size="sm" icon="logout" to="/">
                Sign out
              </Button>
            </div>
            <div className="danger-zone">
              <div className="stack gap-1">
                <strong className="data-actions__title">Delete account</strong>
                <span className="muted data-actions__desc">
                  Permanently deletes your profile, plans, lists, logs and integration connections. This can't be undone.
                </span>
              </div>
              <Field label='Type "delete" to confirm'>
                {(id) => (
                  <input id={id} className="input" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} autoComplete="off" />
                )}
              </Field>
              <Button variant="danger" icon="trash" disabled={confirmDelete.trim().toLowerCase() !== "delete"}>
                Delete my account
              </Button>
            </div>
          </Section>

          <div className="settings__save">
            <span className="subtle">Changes to preferences apply to new plans and suggestions.</span>
            <Button icon="check">Save changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <Card as="section" id={id} className="settings__section" aria-labelledby={`${id}-title`}>
      <div className="stack gap-1 settings__section-head">
        <h2 id={`${id}-title`} className="card__title">
          {title}
        </h2>
        {description && <p className="card__subtitle">{description}</p>}
      </div>
      <div className="stack gap-4">{children}</div>
    </Card>
  );
}

function SubLabel({ children }: { children: ReactNode }) {
  return <p className="settings__sublabel">{children}</p>;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="settings__row">
      <span className="toggle-row__label">{label}</span>
      {children}
    </div>
  );
}
