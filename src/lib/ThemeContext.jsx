import React, { createContext, useContext, useState, useEffect } from "react";
export const ThemeContext = createContext();
export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("kandu_theme") !== "light";
  });

  // Injectar data-theme no <html> para activar as CSS vars Titânio
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    document.documentElement.style.background = isDark ? "#0B0C0E" : "#D6DADF";
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem("kandu_theme", next ? "dark" : "light");
      return next;
    });
  };
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
