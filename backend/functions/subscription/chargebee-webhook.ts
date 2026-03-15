/**
 * POST /v1/webhooks/chargebee
 * Processes Chargebee webhook events to keep subscription state in DynamoDB.
 * No JWT auth — verified by Chargebee webhook Basic Auth.
 *
 * Key design: customer_id = householdId.
 * We set customer[id] = householdId at checkout time, so every webhook
 * carries the householdId as customer_id. No custom fields or meta_data needed.
 *
 * Chargebee PC 2.0: planId read from subscription_items array.
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { putItem } from '../_shared/dynamo';
import type { SubscriptionStatus, ChargebeeEventType } from '@tabletryb/shared';

const WEBHOOK_SECRET = process.env.CHARGEBEE_WEBHOOK_SECRET!;

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    // Verify webhook signature
    if (!verifyWebhookSignature(event)) {
      console.warn('Invalid Chargebee webhook signature');
      return { statusCode: 401, body: 'Invalid signature' };
    }

    const body = JSON.parse(event.body || '{}');
    const eventType = body.event_type as ChargebeeEventType;
    const subscription = body.content?.subscription;

    if (!subscription) {
      console.log('Webhook event without subscription data:', eventType);
      return { statusCode: 200, body: 'OK' };
    }

    // customer_id IS the householdId — set at checkout time via customer[id]
    const householdId = subscription.customer_id;
    if (!householdId) {
      console.error('No customer_id on subscription:', subscription.id);
      return { statusCode: 200, body: 'OK — no customer_id' };
    }

    // PC 2.0: Extract plan ID from subscription_items array
    const planId = extractPlanId(subscription);

    const now = new Date().toISOString();

    // Map Chargebee status to our status
    const statusMap: Record<string, SubscriptionStatus> = {
      in_trial: 'in_trial',
      active: 'active',
      non_renewing: 'active', // Still active until period ends
      paused: 'cancelled',
      cancelled: 'cancelled',
    };

    const status: SubscriptionStatus = statusMap[subscription.status] || 'expired';

    // Determine status based on event type for more nuanced handling
    let finalStatus = status;
    if (eventType === 'payment_failed') {
      finalStatus = 'past_due';
    }

    // Update subscription record in DynamoDB
    await putItem({
      PK: `SUB#${householdId}`,
      SK: 'SUBSCRIPTION',
      GSI2PK: 'SUB#STATUS',
      GSI2SK: `${finalStatus}#${householdId}`,
      householdId,
      chargebeeSubscriptionId: subscription.id,
      chargebeeCustomerId: subscription.customer_id,
      status: finalStatus,
      planId,
      trialStartedAt: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : undefined,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : undefined,
      currentPeriodStart: subscription.current_term_start
        ? new Date(subscription.current_term_start * 1000).toISOString()
        : undefined,
      currentPeriodEnd: subscription.current_term_end
        ? new Date(subscription.current_term_end * 1000).toISOString()
        : undefined,
      cancelledAt: subscription.cancelled_at
        ? new Date(subscription.cancelled_at * 1000).toISOString()
        : undefined,
      updatedAt: now,
      // TTL: if cancelled, expire record after 90 days for cleanup
      ...(finalStatus === 'cancelled' && {
        ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
      }),
    });

    console.log(`Subscription updated: household=${householdId}, status=${finalStatus}, planId=${planId}, event=${eventType}`);

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('Chargebee webhook error:', err);
    // Return 200 to prevent Chargebee from retrying (we'll log and investigate)
    return { statusCode: 200, body: 'Error processed' };
  }
};

/**
 * Extract the plan item price ID from a PC 2.0 subscription object.
 * Falls back to plan_id for PC 1.0 compatibility.
 */
function extractPlanId(subscription: Record<string, any>): string {
  if (Array.isArray(subscription.subscription_items)) {
    const planItem = subscription.subscription_items.find(
      (item: any) => item.item_type === 'plan'
    );
    if (planItem?.item_price_id) {
      return planItem.item_price_id;
    }
  }

  if (subscription.plan_id) {
    return subscription.plan_id;
  }

  console.warn('Could not extract planId from subscription:', subscription.id);
  return 'unknown';
}

/** Verify Chargebee webhook signature via Basic Auth */
function verifyWebhookSignature(event: APIGatewayProxyEventV2): boolean {
  const authHeader = event.headers?.authorization;

  if (!authHeader) return false;

  try {
    const encoded = authHeader.replace('Basic ', '');
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const [username] = decoded.split(':');
    return username === WEBHOOK_SECRET;
  } catch {
    return false;
  }
}