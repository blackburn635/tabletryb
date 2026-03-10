/**
 * ThemeProvider — manages the active color palette and injects
 * CSS custom properties onto document.documentElement.
 *
 * Usage:
 *   <ThemeProvider defaultThemeId="kitchen-warm">
 *     <App />
 *   </ThemeProvider>
 *
 * To switch themes at runtime:
 *   const { setThemeId, themeId, availableThemes } = useTheme();
 *   setThemeId('ocean-blue');
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  THEMES,
  DEFAULT_THEME_ID,
  themeToCSSProperties,
  type ThemePalette,
} from '../config/themes';

interface ThemeContextType {
  /** Currently active theme ID */
  themeId: string;
  /** Currently active palette object */
  theme: ThemePalette;
  /** Switch to a different theme */
  setThemeId: (id: string) => void;
  /** All registered themes for a picker UI */
  availableThemes: ThemePalette[];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};

interface ThemeProviderProps {
  children: ReactNode;
  /** Initial theme ID (defaults to DEFAULT_THEME_ID from config) */
  defaultThemeId?: string;
}

const STORAGE_KEY = 'tabletryb-theme';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultThemeId = DEFAULT_THEME_ID,
}) => {
  // Restore from localStorage if available (persists user preference)
  const [themeId, setThemeIdState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && THEMES[stored]) return stored;
    } catch {
      // localStorage unavailable (SSR, incognito, etc.)
    }
    return defaultThemeId;
  });

  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];

  // Apply CSS custom properties to :root whenever theme changes
  useEffect(() => {
    const props = themeToCSSProperties(theme);
    const root = document.documentElement;

    Object.entries(props).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Set a data attribute for CSS selectors that need theme-aware rules
    root.setAttribute('data-theme', theme.id);
  }, [theme]);

  const setThemeId = useCallback((id: string) => {
    if (!THEMES[id]) {
      console.warn(`Theme "${id}" not found. Available: ${Object.keys(THEMES).join(', ')}`);
      return;
    }
    setThemeIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const availableThemes = useMemo(() => Object.values(THEMES), []);

  return (
    <ThemeContext.Provider value={{ themeId, theme, setThemeId, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};
