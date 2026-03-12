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

  /** Color palette — */
  colors: {
    primary: '#ba626c',       // Mauve
    primaryLight: '#d08e96',  // Light mauve
    primaryDark: '#9a4a53',   // Dark mauve
    secondary: '#8eb66b',     // Lime green
    secondaryLight: '#dfa159', // Mustard
    accent: '#102984',        // Deep blue
    background: '#fdfaf5',    // Warm cream
    backgroundAlt: '#f5efe5', // Darker cream
    surface: '#ffffff',       // Card backgrounds
    text: '#1B1B1B',          // Primary text
    textMuted: '#6B7280',     // Secondary text
    textInverse: '#ffffff',   // Text on colored backgrounds
    border: '#E5E7EB',        // Subtle borders
    success: '#8eb66b',       // Lime green (brand)
    warning: '#dfa159',       // Mustard (brand)
    error: '#ba626c',         // Mauve (brand)
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
