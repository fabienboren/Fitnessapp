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
| `/app/groceries` | Consolidated grocery list, unit conflicts, shopping mode, Kroger / Walmart handoff |
| `/app/settings` | Profile, preferences, notifications, integrations, privacy & account |

Recipes and Progress are placeholders for now. The three core flows are described in
[`docs/user-flows.md`](docs/user-flows.md).

```bash
cd apps/web
npm install
npm run dev
```

## Retailer API (`apps/api`)

A small Node server (no runtime dependencies, Node ≥ 22.18) that holds the **Kroger** and **Walmart**
credentials so they never reach the browser. The web app calls it through Vite's `/api` proxy.

```bash
cd apps/api
cp .env.example .env   # fill in your keys
npm install            # dev-only: TypeScript for `npm run typecheck`
npm run dev            # http://localhost:8787
```

| Retailer | Keys (`apps/api/.env`) | How the handoff works |
| --- | --- | --- |
| Kroger | `KROGER_CLIENT_ID`, `KROGER_CLIENT_SECRET`, `KROGER_REDIRECT_URI` (register `http://localhost:5173/api/kroger/callback` on your app) | Products and stores use an app token. To fill a cart, the shopper signs in to Kroger once (`cart.basic:write`), then items are added to their Kroger cart by UPC. |
| Walmart | `WALMART_CONSUMER_ID`, `WALMART_KEY_VERSION`, `WALMART_PRIVATE_KEY_PATH` (or `WALMART_PRIVATE_KEY`), optional `WALMART_PUBLISHER_ID` | Affiliate API requests are RSA-signed. Walmart has no third-party cart API, so the handoff is an affiliate add-to-cart link. |

Neither path places an order: the shopper reviews and checks out at the store, and the app only ever records
"handed off". Kroger shopper tokens are kept in memory per browser session — move them to your database before
running more than one server instance.

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
