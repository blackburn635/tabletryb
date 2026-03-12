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
// PALETTE: TableTryb Default (brand palette)
// Clean white background with mustard + lime green brand colors
// ============================================================================
export const TABLETRYB_DEFAULT: ThemePalette = {
  id: 'tabletryb-default',
  name: 'TableTryb',
  colors: {
    primary: '#dfa159',
    primaryLight: '#efc088',
    primaryDark: '#c4863d',
    secondary: '#8eb66b',
    secondaryLight: '#b0cf96',
    accent: '#102984',
    background: '#ffffff',
    backgroundAlt: '#f9f7f4',
    surface: '#ffffff',
    text: '#1B1B1B',
    textMuted: '#6B7280',
    textInverse: '#ffffff',
    border: '#E5E7EB',
    success: '#8eb66b',
    warning: '#dfa159',
    error: '#ba626c',
    navGlass: 'rgba(255, 255, 255, 0.92)',
  },
};

// ============================================================================
// PALETTE: Ocean Blue (alternate)
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
// PALETTE: Kitchen Warm (Mauve lead, warm cream background)
// Mauve primary with lime + mustard accents — warm/inviting aesthetic
// ============================================================================
export const KITCHEN_WARM: ThemePalette = {
  id: 'kitchen-warm',
  name: 'Kitchen Warm',
  colors: {
    primary: '#ba626c',
    primaryLight: '#d08e96',
    primaryDark: '#9a4a53',
    secondary: '#8eb66b',
    secondaryLight: '#dfa159',
    accent: '#102984',
    background: '#fdfaf5',
    backgroundAlt: '#f5efe5',
    surface: '#ffffff',
    text: '#1B1B1B',
    textMuted: '#6B7280',
    textInverse: '#ffffff',
    border: '#E5E7EB',
    success: '#8eb66b',
    warning: '#dfa159',
    error: '#ba626c',
    navGlass: 'rgba(253, 250, 245, 0.92)',
  },
};

// ============================================================================
// Theme registry — add new palettes here
// ============================================================================
export const THEMES: Record<string, ThemePalette> = {
  'tabletryb-default': TABLETRYB_DEFAULT,
  'ocean-blue': OCEAN_BLUE,
  'kitchen-warm': KITCHEN_WARM,
};

/** The palette used by default when no preference is set */
export const DEFAULT_THEME_ID = 'kitchen-warm';

/**
 * Generate CSS custom properties from a theme palette.
 * Returns a flat object like { '--color-primary': '#dfa159', ... }
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