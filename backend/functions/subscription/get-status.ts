/**
 * GET /v1/subscription/status
 * Returns subscription status for the authenticated user's household.
 *
 * Three scenarios:
 *   1. SUB# record exists → return Chargebee-managed status
 *   2. No SUB# but household exists → local trial (14 days from household creation)
 *   3. No household → status "none"
 */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser } from '../_shared/auth';
import { getItem } from '../_shared/dynamo';
import { success, error } from '../_shared/response';
import type { SubscriptionStatus } from '@tabletryb/shared';

const TRIAL_DAYS = 14;

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);

    if (!user.householdId) {
      return success({ status: 'none' });
    }

    // Check for Chargebee-managed subscription
    const sub = await getItem(`SUB#${user.householdId}`, 'SUBSCRIPTION') as Record<string, unknown> | null;

    if (sub) {
      // Chargebee subscription exists — use its status
      const trialDaysRemaining = sub.trialEndsAt
        ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt as string).getTime() - Date.now()) / 86400000))
        : undefined;

      return success({
        status: sub.status,
        planId: sub.planId || null,
        trialDaysRemaining,
        currentPeriodEnd: sub.currentPeriodEnd || null,
        cancelAtPeriodEnd: sub.status === 'cancelled',
        chargebeeCustomerId: sub.chargebeeCustomerId || null,
      });
    }

    // No Chargebee subscription — calculate local trial from household creation date
    const household = await getItem(`HH#${user.householdId}`, 'META') as Record<string, unknown> | null;

    if (!household || !household.createdAt) {
      return success({ status: 'none' });
    }

    const createdAt = new Date(household.createdAt as string);
    const trialEndsAt = new Date(createdAt.getTime() + TRIAL_DAYS * 86400000);
    const now = Date.now();
    const daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now) / 86400000));

    const status: SubscriptionStatus = daysRemaining > 0 ? 'in_trial' : 'expired';

    return success({
      status,
      planId: null,
      trialDaysRemaining: daysRemaining,
      trialEndsAt: trialEndsAt.toISOString(),
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      chargebeeCustomerId: null,
    });
  } catch (err) {
    return error(err);
  }
};
