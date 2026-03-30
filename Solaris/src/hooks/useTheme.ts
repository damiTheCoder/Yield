import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" | "system";

const STORAGE_KEY = "forge-app-theme";

const getSystemTheme = (): "dark" | "light" => {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getPreferredTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light" || stored === "system") {
    return stored;
  }
  return "system";
};

const applyTheme = (theme: ThemeMode) => {
  if (typeof document === "undefined") return;
  const actualTheme = theme === "system" ? getSystemTheme() : theme;
  // Apply the theme directly: 'dark' => dark visuals, 'light' => light visuals
  document.documentElement.setAttribute("data-theme", actualTheme);
  document.documentElement.style.colorScheme = actualTheme;
};

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => getPreferredTheme());

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const setThemeWithImmediate = useCallback((newTheme: ThemeMode) => {
    // Apply theme immediately before state update
    applyTheme(newTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, newTheme);
    }
    setTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setThemeWithImmediate(newTheme);
  }, [theme, setThemeWithImmediate]);

  return { theme, setTheme: setThemeWithImmediate, toggleTheme };
}
