import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");

  // On mount — restore theme preference
  useEffect(() => {
    const stored = localStorage.getItem("ntrade_theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else {
      // Default to dark
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const setThemeMode = (mode) => {
    const next = mode === "light" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("ntrade_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeMode(next);
  };

  const isDark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
