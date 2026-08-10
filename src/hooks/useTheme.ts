import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";

type Theme = "light" | "dark";

const STORAGE_KEY = "cln-theme";
const HTML = typeof document !== "undefined" && document.documentElement;
const MEDIA = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)");

/**
 * Determines the initial theme state.
 * It checks localStorage first. If no preference is saved, it falls back to the user's OS preference.
 * 
 * @returns {Theme} The resolved initial theme.
 */
function getInitialTheme(): Theme {
  const storedPreference = typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY);
  if (storedPreference === "light" || storedPreference === "dark") return storedPreference;
  return MEDIA?.matches ? "dark" : "light";
}

/**
 * Applies the given theme to the HTML root element and persists the preference.
 * 
 * @param {Theme} theme - The theme to apply.
 */
function applyThemeToDOM(theme: Theme) {
  if (!HTML) return;
  HTML.classList.toggle("dark", theme === "dark");
  try { 
    localStorage.setItem(STORAGE_KEY, theme); 
  } catch (error) { 
    console.warn("Failed to persist theme preference:", error); 
  }
}

/**
 * Custom hook to manage the application's dark/light theme.
 * Includes support for the modern View Transitions API for smooth animated theme toggling.
 * 
 * @returns {object} The current theme state and a toggle function.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Synchronize the DOM when the theme state changes (e.g., initial load or OS preference change)
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Listen for changes in the user's OS-level theme preference
  useEffect(() => {
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      // We only auto-switch if the user hasn't explicitly set a preference in localStorage
      if (!localStorage.getItem(STORAGE_KEY)) {
        setThemeState(event.matches ? "dark" : "light");
      }
    };
    MEDIA?.addEventListener("change", handleSystemThemeChange);
    return () => MEDIA?.removeEventListener("change", handleSystemThemeChange);
  }, []);

  /**
   * Toggles the theme between light and dark.
   * Uses the View Transitions API and captures mouse coordinates for a custom circular reveal animation.
   */
  const toggleTheme = useCallback((event?: React.MouseEvent | MouseEvent) => {
    if (event && event.clientX && event.clientY) {
      document.documentElement.style.setProperty('--click-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--click-y', `${event.clientY}px`);
    } else {
      document.documentElement.style.setProperty('--click-x', `50%`);
      document.documentElement.style.setProperty('--click-y', `50%`);
    }

    const nextTheme = theme === "dark" ? "light" : "dark";

    const updateDOM = () => {
      applyThemeToDOM(nextTheme);
      setThemeState(nextTheme);
    };

    // Fallback for browsers that do not support the View Transitions API (e.g. Firefox, older Safari)
    if (!document.startViewTransition) {
      updateDOM();
      return;
    }

    // Wrap the state update in a view transition to natively crossfade the entire UI
    document.startViewTransition(() => {
      // flushSync ensures React applies the state update synchronously so the transition API captures the exact before/after DOM states
      flushSync(() => {
        updateDOM();
      });
    });
  }, [theme]);

  return { theme, toggle: toggleTheme, isDark: theme === "dark" };
}
