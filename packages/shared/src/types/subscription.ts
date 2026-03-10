/**
 * Subscription types — Chargebee integration.
 * Simple model: 14-day free trial → single paid plan.
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

/** Plans configuration */
export const PLANS = {
  TABLETRYB_MONTHLY: {
    id: 'tabletryb-monthly',
    name: 'TableTryb Monthly',
    price: 599, // cents
    currency: 'USD',
    interval: 'month' as const,
    trialDays: 14,
  },
  TABLETRYB_ANNUAL: {
    id: 'tabletryb-annual',
    name: 'TableTryb Annual',
    price: 4999, // cents
    currency: 'USD',
    interval: 'year' as const,
    trialDays: 14,
  },
} as const;
