/** PUT /v1/households/{householdId} — Update household settings (admin only) */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser, requireHouseholdPrimary } from '../_shared/auth';
import { putItem, getItem } from '../_shared/dynamo';
import { success, error, parseBody, getPathParam } from '../_shared/response';
import { NotFoundError } from '../_shared/errors';

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const householdId = getPathParam(event.pathParameters, 'householdId');
    requireHouseholdPrimary(user, householdId);
    const body = parseBody<Record<string, unknown>>(event.body);
    const existing = await getItem(`HH#${householdId}`, 'META');
    if (!existing) throw new NotFoundError('Household not found');
    const updated = { ...(existing as Record<string, unknown>), ...body, updatedAt: new Date().toISOString() };
    await putItem(updated);
    return success(updated);
  } catch (err) { return error(err); }
};
