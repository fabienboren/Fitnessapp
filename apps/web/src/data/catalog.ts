/**
 * Illustrative catalog, plan and grocery data for the three core flows.
 * Not real recipes or nutrition records.
 */
import type { MealSlot } from "./mock";

export interface Recipe {
  id: string;
  name: string;
  minutes: number;
  /** Per serving. null = incomplete nutrition data, never zero. */
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  tags: string[];
  allergens: string[];
  /** An ingredient's allergen information couldn't be confirmed. */
  allergenUnresolved?: boolean;
}

export const recipes: Recipe[] = [
  { id: "r1", name: "Overnight oats with berries", minutes: 5, kcal: 410, protein: 14, carbs: 62, fat: 11, tags: ["Vegetarian", "Make ahead"], allergens: ["Milk", "Wheat / gluten"] },
  { id: "r2", name: "Lemon chickpea grain bowl", minutes: 15, kcal: 560, protein: 20, carbs: 78, fat: 18, tags: ["Vegan"], allergens: [] },
  { id: "r3", name: "Miso salmon, rice & greens", minutes: 30, kcal: 640, protein: 42, carbs: 60, fat: 22, tags: ["High protein"], allergens: ["Fish", "Soy"] },
  { id: "r4", name: "Greek yogurt & walnuts", minutes: 2, kcal: null, protein: null, carbs: null, fat: null, tags: ["Vegetarian", "Snack"], allergens: ["Milk", "Tree nuts"] },
  { id: "r5", name: "Sheet‑pan chicken & vegetables", minutes: 30, kcal: 520, protein: 45, carbs: 30, fat: 22, tags: ["High protein"], allergens: [] },
  { id: "r6", name: "Spinach & feta wrap", minutes: 10, kcal: 480, protein: 24, carbs: 48, fat: 20, tags: ["Vegetarian", "Quick"], allergens: ["Milk", "Wheat / gluten"] },
  { id: "r7", name: "Lentil & tomato soup", minutes: 35, kcal: 390, protein: 21, carbs: 56, fat: 8, tags: ["Vegan", "Batch cook"], allergens: [] },
  { id: "r8", name: "Tofu veggie stir‑fry", minutes: 20, kcal: 450, protein: 26, carbs: 40, fat: 19, tags: ["Vegan"], allergens: ["Soy"], allergenUnresolved: true },
  { id: "r9", name: "Turkey & bean chili", minutes: 40, kcal: 530, protein: 38, carbs: 52, fat: 14, tags: ["High protein", "Batch cook"], allergens: [] },
  { id: "r10", name: "Peanut noodle salad", minutes: 15, kcal: 590, protein: 19, carbs: 70, fat: 26, tags: ["Vegan", "Quick"], allergens: ["Peanuts", "Wheat / gluten", "Soy"] },
  { id: "r11", name: "Veggie omelette", minutes: 10, kcal: 340, protein: 22, carbs: 6, fat: 25, tags: ["Vegetarian", "Quick"], allergens: ["Eggs", "Milk"] },
];

export const recipeById = (id: string) => recipes.find((r) => r.id === id)!;

/** The signed-in user's known allergens (from their profile). */
export const userAllergens = ["Peanuts"];

export const conflictsWithUser = (r: Recipe) => r.allergens.filter((a) => userAllergens.includes(a));

/* ---------- Meal plan ---------- */

export interface PlanEntry {
  recipeId: string;
  servings: number;
  /** AI-proposed and not yet approved by the user. */
  proposed?: boolean;
  warning?: string;
}

export type WeekPlan = Record<number, Partial<Record<MealSlot, PlanEntry>>>;

export const planSlots: MealSlot[] = ["breakfast", "lunch", "dinner"];

export const initialPlan: WeekPlan = {
  0: { breakfast: { recipeId: "r1", servings: 1 }, lunch: { recipeId: "r2", servings: 1 }, dinner: { recipeId: "r3", servings: 2 } },
  1: { breakfast: { recipeId: "r1", servings: 1 }, lunch: { recipeId: "r7", servings: 1 }, dinner: { recipeId: "r5", servings: 2 } },
  2: { breakfast: { recipeId: "r11", servings: 1 }, lunch: { recipeId: "r7", servings: 1 } },
  3: { breakfast: { recipeId: "r1", servings: 1 } },
  4: {},
  5: {},
  6: {},
};

/** What the Meal Planning Assistant returns — already passed through the validator. */
export const aiProposal: { day: number; slot: MealSlot; entry: PlanEntry }[] = [
  { day: 2, slot: "dinner", entry: { recipeId: "r9", servings: 2, proposed: true } },
  { day: 3, slot: "lunch", entry: { recipeId: "r6", servings: 1, proposed: true } },
  { day: 3, slot: "dinner", entry: { recipeId: "r8", servings: 2, proposed: true, warning: "Allergen info incomplete for the sauce — check the label." } },
  { day: 4, slot: "lunch", entry: { recipeId: "r2", servings: 1, proposed: true } },
  { day: 4, slot: "dinner", entry: { recipeId: "r5", servings: 2, proposed: true } },
  { day: 5, slot: "dinner", entry: { recipeId: "r3", servings: 2, proposed: true } },
];

/* ---------- Grocery list ---------- */

export type Aisle = "Produce" | "Protein" | "Dairy & eggs" | "Grains & bakery" | "Pantry";

export interface GroceryItem {
  id: string;
  name: string;
  /** null when quantities couldn't be combined */
  quantity: string | null;
  aisle: Aisle;
  checked: boolean;
  /** Recipes that require it; empty for manual items. */
  from: string[];
  manual?: boolean;
  /** Parts that couldn't be added together without a trustworthy conversion. */
  unresolved?: string[];
}

export const groceryItems: GroceryItem[] = [
  { id: "g1", name: "Baby spinach", quantity: null, aisle: "Produce", checked: false, from: ["Spinach & feta wrap", "Miso salmon, rice & greens"], unresolved: ["1 bunch", "150 g"] },
  { id: "g2", name: "Lemons", quantity: "3", aisle: "Produce", checked: true, from: ["Lemon chickpea grain bowl", "Sheet‑pan chicken & vegetables"] },
  { id: "g3", name: "Cherry tomatoes", quantity: "500 g", aisle: "Produce", checked: false, from: ["Lemon chickpea grain bowl", "Lentil & tomato soup"] },
  { id: "g4", name: "Mixed berries", quantity: "400 g", aisle: "Produce", checked: true, from: ["Overnight oats with berries"] },
  { id: "g5", name: "Broccoli", quantity: "2 heads", aisle: "Produce", checked: false, from: ["Sheet‑pan chicken & vegetables", "Tofu veggie stir‑fry"] },
  { id: "g6", name: "Fresh ginger", quantity: null, aisle: "Produce", checked: false, from: ["Miso salmon, rice & greens", "Tofu veggie stir‑fry"], unresolved: ["1 thumb", "2 tsp grated"] },
  { id: "g7", name: "Salmon fillets", quantity: "4 × 140 g", aisle: "Protein", checked: false, from: ["Miso salmon, rice & greens"] },
  { id: "g8", name: "Chicken thighs", quantity: "1.2 kg", aisle: "Protein", checked: false, from: ["Sheet‑pan chicken & vegetables"] },
  { id: "g9", name: "Firm tofu", quantity: "400 g", aisle: "Protein", checked: false, from: ["Tofu veggie stir‑fry"] },
  { id: "g10", name: "Greek yogurt", quantity: "500 g", aisle: "Dairy & eggs", checked: true, from: ["Greek yogurt & walnuts", "Overnight oats with berries"] },
  { id: "g11", name: "Feta", quantity: "200 g", aisle: "Dairy & eggs", checked: false, from: ["Spinach & feta wrap"] },
  { id: "g12", name: "Eggs", quantity: "6", aisle: "Dairy & eggs", checked: false, from: ["Veggie omelette"] },
  { id: "g13", name: "Rolled oats", quantity: "320 g", aisle: "Grains & bakery", checked: true, from: ["Overnight oats with berries"] },
  { id: "g14", name: "Whole‑wheat wraps", quantity: "1 pack", aisle: "Grains & bakery", checked: false, from: ["Spinach & feta wrap"] },
  { id: "g15", name: "Red lentils", quantity: "300 g", aisle: "Pantry", checked: false, from: ["Lentil & tomato soup"] },
  { id: "g16", name: "White miso", quantity: "3 tbsp", aisle: "Pantry", checked: false, from: ["Miso salmon, rice & greens"] },
  { id: "g17", name: "Coffee beans", quantity: null, aisle: "Pantry", checked: false, from: [], manual: true },
  { id: "g18", name: "Dish soap", quantity: null, aisle: "Pantry", checked: false, from: [], manual: true },
];

export const aisles: Aisle[] = ["Produce", "Protein", "Dairy & eggs", "Grains & bakery", "Pantry"];

/* ---------- Activity ---------- */

export const activityTypes = [
  { id: "walk", label: "Walk" },
  { id: "run", label: "Run" },
  { id: "cycle", label: "Cycle" },
  { id: "strength", label: "Strength" },
  { id: "yoga", label: "Yoga" },
  { id: "swim", label: "Swim" },
  { id: "other", label: "Other" },
] as const;
