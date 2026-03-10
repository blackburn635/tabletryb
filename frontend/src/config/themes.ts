/**
 * Theme system — swappable color palettes.
 *
 * HOW TO ADD A NEW PALETTE:
 *   1. Copy an existing palette object below
 *   2. Change the colors
 *   3. Add it to the THEMES map
 *   4. Set it as activeTheme in ThemeProvider, or let users pick
 *
 * Every color here maps 1:1 to a CSS custom property (--color-*).
 * All components already reference these variables, so swapping
 * a palette recolors the entire app instantly — no CSS edits needed.
 */

export interface ThemePalette {
  /** Unique identifier */
  id: string;
  /** Display name for theme picker UI */
  name: string;
  /** Color tokens — each becomes a CSS custom property */
  colors: ThemeColors;
  /** Font stack overrides (optional — falls back to defaults) */
  fonts?: Partial<ThemeFonts>;
}

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  background: string;
  backgroundAlt: string;
  surface: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  /** Nav bar background — derived from background with opacity for glass effect */
  navGlass: string;
}

export interface ThemeFonts {
  sans: string;
  serif: string;
}

const DEFAULT_FONTS: ThemeFonts = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  serif: "'Crimson Pro', Georgia, serif",
};

// ============================================================================
// PALETTE: Kitchen Warm (current default)
// Warm cream backgrounds with forest green accents — kitchen/food aesthetic
// ============================================================================
export const KITCHEN_WARM: ThemePalette = {
  id: 'kitchen-warm',
  name: 'Kitchen Warm',
  colors: {
    primary: '#2D6A4F',
    primaryLight: '#52B788',
    primaryDark: '#1B4332',
    secondary: '#E76F51',
    secondaryLight: '#F4A261',
    accent: '#264653',
    background: '#FEFAE0',
    backgroundAlt: '#F5F0E1',
    surface: '#FFFFFF',
    text: '#1B1B1B',
    textMuted: '#6B7280',
    textInverse: '#FFFFFF',
    border: '#E5E7EB',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    navGlass: 'rgba(254, 250, 224, 0.92)',
  },
};

// ============================================================================
// PALETTE: Ocean Blue (example alternate)
// Cool blues with sandy neutrals — coastal/fresh aesthetic
// ============================================================================
export const OCEAN_BLUE: ThemePalette = {
  id: 'ocean-blue',
  name: 'Ocean Blue',
  colors: {
    primary: '#1D4ED8',
    primaryLight: '#60A5FA',
    primaryDark: '#1E3A8A',
    secondary: '#F59E0B',
    secondaryLight: '#FCD34D',
    accent: '#0F766E',
    background: '#F8FAFC',
    backgroundAlt: '#F1F5F9',
    surface: '#FFFFFF',
    text: '#0F172A',
    textMuted: '#64748B',
    textInverse: '#FFFFFF',
    border: '#E2E8F0',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    navGlass: 'rgba(248, 250, 252, 0.92)',
  },
};

// ============================================================================
// PALETTE: Midnight (example dark mode)
// Dark surfaces with vibrant accents
// ============================================================================
export const MIDNIGHT: ThemePalette = {
  id: 'midnight',
  name: 'Midnight',
  colors: {
    primary: '#818CF8',
    primaryLight: '#A5B4FC',
    primaryDark: '#6366F1',
    secondary: '#FB923C',
    secondaryLight: '#FDBA74',
    accent: '#2DD4BF',
    background: '#0F172A',
    backgroundAlt: '#1E293B',
    surface: '#1E293B',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    textInverse: '#0F172A',
    border: '#334155',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    navGlass: 'rgba(15, 23, 42, 0.92)',
  },
};

// ============================================================================
// Theme registry — add new palettes here
// ============================================================================
export const THEMES: Record<string, ThemePalette> = {
  'kitchen-warm': KITCHEN_WARM,
  'ocean-blue': OCEAN_BLUE,
  'midnight': MIDNIGHT,
};

/** The palette used by default when no preference is set */
export const DEFAULT_THEME_ID = 'kitchen-warm';

/**
 * Generate CSS custom properties from a theme palette.
 * Returns a flat object like { '--color-primary': '#2D6A4F', ... }
 */
export function themeToCSSProperties(
  theme: ThemePalette
): Record<string, string> {
  const fonts = { ...DEFAULT_FONTS, ...theme.fonts };

  return {
    '--color-primary': theme.colors.primary,
    '--color-primary-light': theme.colors.primaryLight,
    '--color-primary-dark': theme.colors.primaryDark,
    '--color-secondary': theme.colors.secondary,
    '--color-secondary-light': theme.colors.secondaryLight,
    '--color-accent': theme.colors.accent,
    '--color-bg': theme.colors.background,
    '--color-bg-alt': theme.colors.backgroundAlt,
    '--color-surface': theme.colors.surface,
    '--color-text': theme.colors.text,
    '--color-text-muted': theme.colors.textMuted,
    '--color-text-inverse': theme.colors.textInverse,
    '--color-border': theme.colors.border,
    '--color-success': theme.colors.success,
    '--color-warning': theme.colors.warning,
    '--color-error': theme.colors.error,
    '--color-nav-glass': theme.colors.navGlass,
    '--font-sans': fonts.sans,
    '--font-serif': fonts.serif,
  };
}
