/** PUT /v1/households/{householdId}/recipes/{recipeId} */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser, requireHouseholdAccess } from '../_shared/auth';
import { getItem, putItem } from '../_shared/dynamo';
import { success, error, parseBody, getPathParam } from '../_shared/response';
import { NotFoundError } from '../_shared/errors';

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const householdId = getPathParam(event.pathParameters, 'householdId');
    requireHouseholdAccess(user, householdId);
    const recipeId = getPathParam(event.pathParameters, 'recipeId');
    const existing = await getItem(`HH#${householdId}`, `RECIPE#${recipeId}`);
    if (!existing) throw new NotFoundError('Recipe not found');
    const body = parseBody<Record<string, unknown>>(event.body);
    const updated = { ...(existing as Record<string, unknown>), ...body, updatedAt: new Date().toISOString() };
    if (body.title) (updated as Record<string, unknown>).GSI1SK = (body.title as string).toLowerCase();
    await putItem(updated);
    return success(updated);
  } catch (err) { return error(err); }
};
