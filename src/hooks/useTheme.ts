import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" | "system";

const STORAGE_KEY = "forge-app-theme";

const getPreferredTheme = (): ThemeMode => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, "light");
  }
  return "light";
};

const applyTheme = (theme: ThemeMode) => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", "light");
  document.documentElement.style.colorScheme = "light";
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
    applyTheme("light");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "light");
    }
    setTheme("light");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeWithImmediate("light");
  }, [setThemeWithImmediate]);

  return { theme, setTheme: setThemeWithImmediate, toggleTheme };
}
