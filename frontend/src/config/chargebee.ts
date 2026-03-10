/**
 * Chargebee frontend configuration.
 * Used for opening hosted checkout pages and the customer billing portal.
 */

export const chargebeeConfig = {
  /** Chargebee site name — set via environment variable */
  site: process.env.REACT_APP_CHARGEBEE_SITE || 'tabletryb-test',

  /** Plan IDs must match what's configured in Chargebee dashboard */
  plans: {
    monthly: 'tabletryb-monthly',
    annual: 'tabletryb-annual',
  },

  /** Trial duration in days */
  trialDays: 14,
};

/**
 * Open Chargebee hosted checkout page.
 * The checkout URL is generated server-side by the create-checkout Lambda.
 */
export function openCheckout(checkoutUrl: string): void {
  window.location.href = checkoutUrl;
}

/**
 * Open Chargebee customer portal.
 * The portal URL is generated server-side.
 */
export function openBillingPortal(portalUrl: string): void {
  window.open(portalUrl, '_blank');
}
