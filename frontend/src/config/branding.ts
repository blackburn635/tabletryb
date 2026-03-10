/**
 * Frontend branding configuration.
 * Imports base branding from shared package and adds frontend-specific values.
 * PLACEHOLDER: Update when branding is finalized.
 */

import { BRAND } from '@tabletryb/shared';

export { BRAND };

/** CSS custom properties for branding colors — injected into :root */
export const CSS_VARIABLES = {
  '--color-primary': BRAND.colors.primary,
  '--color-primary-light': BRAND.colors.primaryLight,
  '--color-primary-dark': BRAND.colors.primaryDark,
  '--color-secondary': BRAND.colors.secondary,
  '--color-secondary-light': BRAND.colors.secondaryLight,
  '--color-accent': BRAND.colors.accent,
  '--color-bg': BRAND.colors.background,
  '--color-bg-alt': BRAND.colors.backgroundAlt,
  '--color-surface': BRAND.colors.surface,
  '--color-text': BRAND.colors.text,
  '--color-text-muted': BRAND.colors.textMuted,
  '--color-text-inverse': BRAND.colors.textInverse,
  '--color-border': BRAND.colors.border,
  '--color-success': BRAND.colors.success,
  '--color-warning': BRAND.colors.warning,
  '--color-error': BRAND.colors.error,
} as const;
