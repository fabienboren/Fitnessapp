# NutriFit Companion

Meal planning, grocery lists, nutrition and fitness tracking in one connected app.

## Web app (`apps/web`)

React + TypeScript + Vite. This design pass covers:

| Route | Screen |
| --- | --- |
| `/` | Public home page |
| `/onboarding` | 5-step onboarding (account, food, goals, routine, privacy) |
| `/app` | Dashboard, with meal and activity logging sheets |
| `/app/plan` | Weekly meal planner: add, swap, AI suggestions, review and validated save |
| `/app/groceries` | Consolidated grocery list, unit conflicts, shopping mode, store handoff |
| `/app/settings` | Profile, preferences, notifications, integrations, privacy & account |

Recipes and Progress are placeholders for now. The three core flows are described in
[`docs/user-flows.md`](docs/user-flows.md).

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
│   ├── ui/        Button, Icon, Card, Badge, ProgressRing/Bar, Toggle, Chip, Field, Segmented, ChoiceCard, Sheet, Toast
│   ├── flows/     RecipePicker, RecipeFacts, ServingsStepper, LogMealSheet, LogActivitySheet
│   └── layout/    AppShell (sidebar ≥1024px, bottom tabs on mobile), AccountMenu, Logo
├── pages/         HomePage, OnboardingPage, DashboardPage, PlanPage, GroceriesPage, SettingsPage
└── data/          mock.ts, catalog.ts — illustrative data only
```

The UI follows the blueprint's data rules: a planned meal only counts once it's logged, missing values show as
gaps (never zero), nutrition is labelled as estimated, and AI suggestions need the user's approval.
