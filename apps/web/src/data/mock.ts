/**
 * Illustrative data for the UI only — not real recipes or records.
 * Shapes mirror the blueprint's data rules: values carry a source,
 * and `null` means "missing", never zero.
 */

export type Source = "user" | "calculated" | "imported" | "ai_suggested";
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export interface PlannedMeal {
  id: string;
  recipeId: string;
  slot: MealSlot;
  time: string;
  recipeName: string;
  servings: number;
  prepMinutes: number;
  /** null when the recipe has incomplete nutrition data */
  kcal: number | null;
  /** Logged separately — a planned meal is never assumed eaten. */
  logged: boolean;
}

export interface Macro {
  key: "protein" | "carbs" | "fat";
  label: string;
  grams: number | null;
  target: number;
  color: string;
}

export interface DayActivity {
  day: string;
  /** null = nothing logged, which is not the same as inactive */
  minutes: number | null;
}

export const user = {
  firstName: "Alex",
  email: "alex@example.com",
  initials: "AL",
};

export const todayMeals: PlannedMeal[] = [
  { id: "m1", recipeId: "r1", slot: "breakfast", time: "7:30", recipeName: "Overnight oats with berries", servings: 1, prepMinutes: 5, kcal: 410, logged: true },
  { id: "m2", recipeId: "r2", slot: "lunch", time: "12:30", recipeName: "Lemon chickpea grain bowl", servings: 1, prepMinutes: 15, kcal: 560, logged: true },
  { id: "m3", recipeId: "r4", slot: "snack", time: "16:00", recipeName: "Greek yogurt & walnuts", servings: 1, prepMinutes: 2, kcal: null, logged: false },
  { id: "m4", recipeId: "r3", slot: "dinner", time: "19:00", recipeName: "Miso salmon, rice & greens", servings: 2, prepMinutes: 30, kcal: 640, logged: false },
];

export const nutrition = {
  kcalLogged: 970,
  kcalTarget: 2100,
  source: "calculated" as Source,
  /** Share of logged items with complete nutrition data */
  completeness: 1,
  macros: [
    { key: "protein", label: "Protein", grams: 54, target: 120, color: "var(--macro-protein)" },
    { key: "carbs", label: "Carbs", grams: 118, target: 240, color: "var(--macro-carbs)" },
    { key: "fat", label: "Fat", grams: 31, target: 70, color: "var(--macro-fat)" },
  ] satisfies Macro[],
};

/** Last seven days, oldest first; the final entry is today. */
export const activityWeek: DayActivity[] = [
  { day: "Mon", minutes: 35 },
  { day: "Tue", minutes: 20 },
  { day: "Wed", minutes: null },
  { day: "Thu", minutes: 45 },
  { day: "Fri", minutes: 30 },
  { day: "Sat", minutes: null },
  { day: "Sun", minutes: null },
];

export const activityGoalMinutes = 150;

export const nextPrep = {
  title: "Marinate salmon for dinner",
  due: "Start by 6:15 pm",
  forMeal: "Miso salmon, rice & greens",
  minutes: 10,
};

export const grocery = {
  listName: "Week of Oct 19",
  total: 24,
  checked: 9,
  unresolved: 2,
};

export const aiProposal = {
  title: "Swap Thursday's lunch for a faster option",
  reason:
    "You marked Thursday as a busy day. This 10‑minute wrap keeps a similar protein estimate and uses spinach already on your list.",
  status: "needs_approval" as const,
};

export const dietOptions = ["No preference", "Vegetarian", "Vegan", "Pescatarian", "Mediterranean", "Low‑carb", "Halal", "Kosher"];
export const allergenOptions = ["Peanuts", "Tree nuts", "Milk", "Eggs", "Fish", "Shellfish", "Soy", "Wheat / gluten", "Sesame"];
export const dislikeOptions = ["Mushrooms", "Cilantro", "Olives", "Spicy food", "Tofu", "Seafood"];

export const integrations: { id: string; name: string; description: string; status: "connected" | "not_connected" | "unavailable" }[] = [
  { id: "health", name: "Apple Health / Health Connect", description: "Import workouts and steps", status: "not_connected" },
  { id: "recipes", name: "Recipe & nutrition provider", description: "Catalog data source", status: "connected" },
];
