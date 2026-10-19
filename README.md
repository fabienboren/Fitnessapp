# NutriFit Companion

Meal planning, grocery lists, nutrition and fitness tracking in one connected app.

## Web app (`apps/web`)

React + TypeScript + Vite. This design pass covers:

| Route | Screen |
| --- | --- |
| `/` | Public home page |
| `/onboarding` | 5-step onboarding (account, food, goals, routine, privacy) |
| `/app` | Dashboard (today's meals, nutrition, AI proposal, prep, activity, groceries) |
| `/app/settings` | Profile, preferences, notifications, integrations, privacy & account |

Plan, Recipes, Groceries and Progress are placeholders for now.

```bash
cd apps/web
npm install
npm run dev
```

### Structure

```
src/
├── styles/        tokens.css (colour, spacing, type, light/dark) · global.css
├── components/
│   ├── ui/        Button, Icon, Card, Badge, ProgressRing/Bar, Toggle, Chip, Field, Segmented, ChoiceCard
│   └── layout/    AppShell (sidebar ≥1024px, bottom tabs on mobile), AccountMenu, Logo
├── pages/         HomePage, OnboardingPage, DashboardPage, SettingsPage
└── data/mock.ts   Illustrative data only
```

The UI follows the blueprint's data rules: a planned meal only counts once it's logged, missing values show as
gaps (never zero), nutrition is labelled as estimated, and AI suggestions need the user's approval.
