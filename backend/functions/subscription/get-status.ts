/** GET /v1/subscription/status */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser } from '../_shared/auth';
import { getItem } from '../_shared/dynamo';
import { success, error } from '../_shared/response';

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    if (!user.householdId) return success({ status: 'none' });
    const sub = await getItem(`SUB#${user.householdId}`, 'SUBSCRIPTION');
    if (!sub) return success({ status: 'none' });
    const s = sub as Record<string, unknown>;
    const trialDaysRemaining = s.trialEndsAt
      ? Math.max(0, Math.ceil((new Date(s.trialEndsAt as string).getTime() - Date.now()) / 86400000))
      : undefined;
    return success({ status: s.status, planId: s.planId, trialDaysRemaining, currentPeriodEnd: s.currentPeriodEnd });
  } catch (err) { return error(err); }
};
