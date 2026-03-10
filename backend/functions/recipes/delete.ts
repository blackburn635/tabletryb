/** DELETE /v1/households/{householdId}/recipes/{recipeId} — Admin only */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser, requireHouseholdPrimary } from '../_shared/auth';
import { deleteItem } from '../_shared/dynamo';
import { noContent, error, getPathParam } from '../_shared/response';

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const householdId = getPathParam(event.pathParameters, 'householdId');
    requireHouseholdPrimary(user, householdId);
    const recipeId = getPathParam(event.pathParameters, 'recipeId');
    await deleteItem(`HH#${householdId}`, `RECIPE#${recipeId}`);
    return noContent();
  } catch (err) { return error(err); }
};
