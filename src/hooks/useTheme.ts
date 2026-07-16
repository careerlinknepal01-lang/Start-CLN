import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "cln-theme";
const HTML = typeof document !== "undefined" && document.documentElement;
const MEDIA = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)");

function getInitial(): Theme {
  const stored = typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return MEDIA?.matches ? "dark" : "light";
}

function apply(theme: Theme) {
  if (!HTML) return;
  HTML.classList.toggle("dark", theme === "dark");
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitial);

  useEffect(() => {
    apply(theme);
  }, [theme]);

  useEffect(() => {
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };
    MEDIA?.addEventListener("change", handler);
    return () => MEDIA?.removeEventListener("change", handler);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggle, isDark: theme === "dark" };
}
