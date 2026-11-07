import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

/**
 * Temas do KANDU.
 *  light / dark        — Titânio (o que já existia, sem alterações)
 *  ember-light / ember-dark — família Ember (Volume 3 do rebranding, E3)
 *
 * O tema é só pele: nenhuma lógica de negócio depende destes valores.
 * `isDark` mantém o significado antigo (true no escuro) para todos os
 * componentes que já o consomem, e `isEmber` serve às poucas superfícies
 * que precisam de saber que a luz de fundo é quente.
 */
export const THEMES = ["light", "dark", "ember-light", "ember-dark"];
export const THEME_META = {
  "light":       { label: "Claro",        family: "titânio", dark: false },
  "dark":        { label: "Escuro",       family: "titânio", dark: true  },
  "ember-light": { label: "Ember claro",  family: "ember",   dark: false },
  "ember-dark":  { label: "Ember escuro", family: "ember",   dark: true  },
};

const LEGACY = { light: "light", dark: "dark" };

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem("kandu_theme");
    if (THEMES.includes(saved)) return saved;
    return LEGACY[saved] || "dark";
  });

  const isDark = theme.endsWith("dark");
  const isEmber = theme.startsWith("ember");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // cor de base do documento (o resto da luz vem do #root::before em CSS)
    document.documentElement.style.background =
      theme === "ember-light" ? "#FFF3EA" :
      theme === "ember-dark"  ? "#0B0806" :
      isDark ? "#0B0C0E" : "#D6DADF";
  }, [theme, isDark]);

  const setTheme = useCallback((next) => {
    if (!THEMES.includes(next)) return;
    localStorage.setItem("kandu_theme", next);
    setThemeState(next);
  }, []);

  // Mantém o comportamento antigo: um toque troca claro ↔ escuro
  // dentro da família actual (titânio ou ember).
  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = isEmberTheme(prev)
        ? (prev === "ember-light" ? "ember-dark" : "ember-light")
        : (prev === "dark" ? "light" : "dark");
      localStorage.setItem("kandu_theme", next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    theme, setTheme, toggleTheme, isDark, isEmber, isEmberTheme,
  }), [theme, setTheme, toggleTheme, isDark, isEmber]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function isEmberTheme(t) {
  return typeof t === "string" && t.startsWith("ember");
}

export const useTheme = () => useContext(ThemeContext);
