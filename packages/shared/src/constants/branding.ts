/**
 * Branding constants — PLACEHOLDER values.
 * Update these two files when branding is finalized:
 *   1. packages/shared/src/constants/branding.ts (this file — used by backend)
 *   2. frontend/src/config/branding.ts (frontend-specific, imports from here)
 *
 * All brand references throughout the app cascade from these values.
 */

export const BRAND = {
  /** Application name — displayed in nav, titles, emails */
  name: 'TableTryb', // PLACEHOLDER

  /** Short tagline for hero sections and meta descriptions */
  tagline: "Your family's meals, planned together.", // PLACEHOLDER

  /** Longer description for SEO and marketing */
  description:
    'Import recipes from anywhere. Vote as a family. Get a smart grocery list. Dinner, decided.', // PLACEHOLDER

  /** Legal entity */
  company: 'Cloudscribble LLC',

  /** Domain — used for CORS, emails, links */
  domain: 'tabletryb.com', // PLACEHOLDER

  /** Support email */
  supportEmail: 'support@tabletryb.com', // PLACEHOLDER

  /** No-reply email for transactional messages (invites, notifications) */
  noReplyEmail: 'noreply@tabletryb.com', // PLACEHOLDER

  /** Color palette — PLACEHOLDER values (warm kitchen aesthetic) */
  colors: {
    primary: '#2D6A4F', // Forest green
    primaryLight: '#52B788', // Light green
    primaryDark: '#1B4332', // Dark green
    secondary: '#E76F51', // Warm coral
    secondaryLight: '#F4A261', // Amber
    accent: '#264653', // Deep teal
    background: '#FEFAE0', // Warm cream
    backgroundAlt: '#F5F0E1', // Slightly darker cream
    surface: '#FFFFFF', // Card backgrounds
    text: '#1B1B1B', // Primary text
    textMuted: '#6B7280', // Secondary text
    textInverse: '#FFFFFF', // Text on dark backgrounds
    border: '#E5E7EB', // Subtle borders
    success: '#059669', // Green
    warning: '#D97706', // Amber
    error: '#DC2626', // Red
  },

  /** Logo file paths — PLACEHOLDER: replace with actual logo files */
  logo: {
    /** Full logo (name + mark) for light backgrounds */
    light: '/assets/logo-light.svg',
    /** Full logo for dark backgrounds */
    dark: '/assets/logo-dark.svg',
    /** Icon only (for favicon, mobile, small spaces) */
    icon: '/assets/logo-icon.svg',
    /** Square logo for social sharing / OG images */
    social: '/assets/logo-social.png',
  },

  /** Social links — PLACEHOLDER */
  social: {
    twitter: '', // PLACEHOLDER
    instagram: '', // PLACEHOLDER
    facebook: '', // PLACEHOLDER
  },
} as const;

/** Type helper for accessing brand colors */
export type BrandColor = keyof typeof BRAND.colors;
