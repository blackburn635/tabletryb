/**
 * Subscription types — Chargebee integration.
 * Simple model: 14-day free trial → single paid plan.
 *
 * UPDATED for Chargebee Product Catalog 2.0:
 *   - Plan IDs are now "item price IDs" (e.g. TableTryb-USD-Monthly)
 *   - Prices updated: monthly $4.99, annual $49.99
 */

export type SubscriptionStatus =
  | 'in_trial'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | 'none'; // No subscription yet (just signed up, hasn't created household)

export interface Subscription {
  householdId: string;
  chargebeeSubscriptionId: string;
  chargebeeCustomerId: string;
  status: SubscriptionStatus;
  planId: string;
  trialStartedAt?: string;
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelledAt?: string;
  updatedAt: string;
}

export interface SubscriptionStatusResponse {
  status: SubscriptionStatus;
  planId: string;
  trialDaysRemaining?: number;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  /** URL to Chargebee customer portal for billing management */
  portalUrl?: string;
}

export interface CreateCheckoutRequest {
  householdId: string;
  planId: string;
  /** Redirect URL after checkout completes */
  redirectUrl: string;
}

export interface CreateCheckoutResponse {
  checkoutUrl: string;
}

/**
 * Chargebee webhook event types we handle.
 * See: https://apidocs.chargebee.com/docs/api/events
 */
export type ChargebeeEventType =
  | 'subscription_created'
  | 'subscription_started'
  | 'subscription_activated'
  | 'subscription_renewed'
  | 'subscription_cancelled'
  | 'subscription_reactivated'
  | 'subscription_changed'
  | 'subscription_trial_end_reminder'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'payment_refunded';

/**
 * Plans configuration — Chargebee PC 2.0 item price IDs.
 * These must match the item price IDs configured in the Chargebee dashboard.
 */
export const PLANS = {
  TABLETRYB_MONTHLY: {
    id: 'TableTryb-USD-Monthly',
    name: 'TableTryb Monthly',
    price: 499, // cents — $4.99/mo
    currency: 'USD',
    interval: 'month' as const,
    trialDays: 14,
  },
  TABLETRYB_ANNUAL: {
    id: 'TableTryb-USD-Yearly',
    name: 'TableTryb Annual',
    price: 4999, // cents — $49.99/yr
    currency: 'USD',
    interval: 'year' as const,
    trialDays: 14,
  },
} as const;
