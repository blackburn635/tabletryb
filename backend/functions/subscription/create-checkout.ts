/**
 * POST /v1/subscription/checkout — Generate Chargebee checkout URL.
 *
 * UPDATED for Chargebee Product Catalog 2.0:
 *   - Endpoint: checkout_new_for_items (was checkout_new)
 *   - Parameter: subscription_items[item_price_id][0] (was subscription[plan_id])
 *   - Custom field passed via subscription[cf_household_id]
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

    // Create Chargebee hosted checkout page (PC 2.0 item-based API)
    const cbResponse = await fetch(
      `https://${CHARGEBEE_SITE}.chargebee.com/api/v2/hosted_pages/checkout_new_for_items`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(CHARGEBEE_API_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          // PC 2.0: item price ID instead of plan_id
          'subscription_items[item_price_id][0]': body.planId,
          'subscription_items[quantity][0]': '1',
          // Customer details pre-filled
          'customer[email]': user.email,
          'customer[first_name]': user.displayName,
          // Custom field to link subscription to household
          'subscription[cf_household_id]': body.householdId,
          // Redirect back to app after checkout
          'redirect_url': body.redirectUrl,
        }),
      }
    );

    if (!cbResponse.ok) {
      const errBody = await cbResponse.text();
      console.error('Chargebee checkout error:', cbResponse.status, errBody);
      return error(new Error(`Chargebee API error: ${cbResponse.status}`));
    }

    const cbData = await cbResponse.json();
    return success({ checkoutUrl: cbData.hosted_page?.url });
  } catch (err) { return error(err); }
};
