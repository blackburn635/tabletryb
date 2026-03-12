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
    primary: '#dfa159',       // Mustard — main brand
    primaryLight: '#efc088',  // Light mustard
    primaryDark: '#c4863d',   // Dark mustard
    secondary: '#8eb66b',     // Lime green — secondary brand
    secondaryLight: '#b0cf96', // Light lime
    accent: '#102984',        // Deep blue
    background: '#ffffff',    // White
    backgroundAlt: '#f9f7f4', // Warm off-white
    surface: '#ffffff',       // Card backgrounds
    text: '#1B1B1B',          // Primary text
    textMuted: '#6B7280',     // Secondary text
    textInverse: '#ffffff',   // Text on colored backgrounds
    border: '#E5E7EB',        // Subtle borders
    success: '#8eb66b',       // Lime green (brand)
    warning: '#dfa159',       // Mustard (brand)
    error: '#ba626c',         // Mauve
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
