/**
 * POST /v1/subscription/checkout — Generate Chargebee checkout URL.
 *
 * Key design: customer[id] = householdId.
 * This means every Chargebee webhook carries customer_id = householdId.
 * No custom fields, no meta_data, no mapping table needed.
 *
 * Chargebee PC 2.0 item-based checkout.
 */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser } from '../_shared/auth';
import { success, error, parseBody } from '../_shared/response';
import type { CreateCheckoutRequest } from '@tabletryb/shared';

const CHARGEBEE_SITE = process.env.CHARGEBEE_SITE!;
const CHARGEBEE_API_KEY = process.env.CHARGEBEE_API_KEY!;

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const body = parseBody<CreateCheckoutRequest>(event.body);

    // Build checkout params
    const params: Record<string, string> = {
      // PC 2.0: item price ID
      'subscription_items[item_price_id][0]': body.planId,
      'subscription_items[quantity][0]': '1',
      // Customer ID = householdId — this is the key linking mechanism.
      // Every webhook Chargebee sends will carry customer_id = householdId.
      'customer[id]': body.householdId,
      'customer[email]': user.email,
      'customer[first_name]': user.firstName || user.displayName,
      // Redirect back to app after checkout
      'redirect_url': body.redirectUrl,
    };

    // Only include last_name if we have it
    if (user.lastName) {
      params['customer[last_name]'] = user.lastName;
    }

    // Create Chargebee hosted checkout page (PC 2.0 item-based API)
    const cbResponse = await fetch(
      `https://${CHARGEBEE_SITE}.chargebee.com/api/v2/hosted_pages/checkout_new_for_items`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(CHARGEBEE_API_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      }
    );

    if (!cbResponse.ok) {
      const errBody = await cbResponse.text();
      console.error('Chargebee checkout error:', cbResponse.status, errBody);
      return error(new Error(`Chargebee API error: ${cbResponse.status}`));
    }

    const cbData = await cbResponse.json() as { hosted_page?: { url?: string } };
    return success({ checkoutUrl: cbData.hosted_page?.url });
  } catch (err) { return error(err); }
};