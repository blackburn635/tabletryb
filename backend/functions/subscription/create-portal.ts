/**
 * POST /v1/subscription/portal
 * Generates a Chargebee customer portal session URL.
 * Only the account holder can access billing management.
 *
 * Requires an active Chargebee subscription (customer must exist in Chargebee).
 */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser } from '../_shared/auth';
import { getItem } from '../_shared/dynamo';
import { success, error } from '../_shared/response';
import { BadRequestError, NotFoundError } from '../_shared/errors';

const CHARGEBEE_SITE = process.env.CHARGEBEE_SITE!;
const CHARGEBEE_API_KEY = process.env.CHARGEBEE_API_KEY!;

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);

    if (!user.householdId) {
      throw new BadRequestError('No household found');
    }

    // Look up the Chargebee customer ID from the subscription record
    const sub = await getItem(`SUB#${user.householdId}`, 'SUBSCRIPTION') as Record<string, unknown> | null;

    if (!sub || !sub.chargebeeCustomerId) {
      throw new NotFoundError('No active subscription found. Subscribe first to access billing management.');
    }

    // Create a Chargebee portal session
    const cbResponse = await fetch(
      `https://${CHARGEBEE_SITE}.chargebee.com/api/v2/portal_sessions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(CHARGEBEE_API_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'customer[id]': sub.chargebeeCustomerId as string,
        }),
      }
    );

    if (!cbResponse.ok) {
      const errBody = await cbResponse.text();
      console.error('Chargebee portal session error:', cbResponse.status, errBody);
      throw new Error(`Failed to create portal session: ${cbResponse.status}`);
    }

    const cbData = await cbResponse.json() as { portal_session?: { access_url?: string } };
    const portalUrl = cbData.portal_session?.access_url;

    if (!portalUrl) {
      throw new Error('No access_url in Chargebee portal session response');
    }

    return success({ portalUrl });
  } catch (err) {
    return error(err);
  }
};
