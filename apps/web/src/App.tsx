import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { SettingsPage } from "./pages/SettingsPage";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="plan"
            element={<PlaceholderPage title="Plan" icon="calendar" description="Weekly meal calendar, swaps and saved plans." />}
          />
          <Route
            path="recipes"
            element={<PlaceholderPage title="Recipes" icon="book" description="Search and filter recipes by diet, allergens and prep time." />}
          />
          <Route
            path="groceries"
            element={<PlaceholderPage title="Groceries" icon="cart" description="Your consolidated list with manual items and checkboxes." />}
          />
          <Route
            path="progress"
            element={<PlaceholderPage title="Progress" icon="chart" description="Meal and activity trends from the records you've logged." />}
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
