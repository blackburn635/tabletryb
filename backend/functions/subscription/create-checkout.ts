/** POST /v1/subscription/checkout — Generate Chargebee checkout URL */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser } from '../_shared/auth';
import { success, error, parseBody } from '../_shared/response';
import type { CreateCheckoutRequest } from '@tabletryb/shared';

const CHARGEBEE_SITE = process.env.CHARGEBEE_SITE!;
const CHARGEBEE_API_KEY = process.env.CHARGEBEE_API_KEY!;

interface ChargebeeCheckoutResponse {
  hosted_page?: {
    url?: string;
  };
}

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const body = parseBody<CreateCheckoutRequest>(event.body);

    // Create Chargebee hosted checkout page
    const cbResponse = await fetch(
      `https://${CHARGEBEE_SITE}.chargebee.com/api/v2/hosted_pages/checkout_new`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(CHARGEBEE_API_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'subscription[plan_id]': body.planId,
          'subscription[trial_end]': '0', // Use plan's trial period
          'customer[email]': user.email,
          'customer[first_name]': user.displayName,
          'subscription[cf_household_id]': body.householdId,
          'redirect_url': body.redirectUrl,
        }),
      }
    );

    const cbData = await cbResponse.json() as ChargebeeCheckoutResponse;
    return success({ checkoutUrl: cbData.hosted_page?.url });
  } catch (err) { return error(err); }
};