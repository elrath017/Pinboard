import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // 0. Check URL query param (?theme=dark or ?theme=light)
    if (typeof window !== 'undefined') {
      const urlParam = new URLSearchParams(window.location.search).get('theme');
      if (urlParam === 'light' || urlParam === 'dark') {
        return urlParam;
      }
    }
    // 1. Check localStorage if user explicitly chose a theme
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pinboard_theme') as Theme | null;
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    }
    // 2. Default to Day (Light) mode so the website opens in the classic noticeboard day look
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pinboard_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
