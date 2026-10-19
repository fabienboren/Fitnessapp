import type { IconName } from "../ui/Icon";

// Primary navigation per the blueprint: Home · Plan · Recipes · Groceries · Progress.
export const navItems: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: "/app", label: "Home", icon: "home", end: true },
  { to: "/app/plan", label: "Plan", icon: "calendar" },
  { to: "/app/recipes", label: "Recipes", icon: "book" },
  { to: "/app/groceries", label: "Groceries", icon: "cart" },
  { to: "/app/progress", label: "Progress", icon: "chart" },
];
