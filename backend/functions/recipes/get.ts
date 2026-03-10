/** GET /v1/households/{householdId}/recipes/{recipeId} */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser, requireHouseholdAccess } from '../_shared/auth';
import { getItem } from '../_shared/dynamo';
import { success, error, getPathParam } from '../_shared/response';
import { NotFoundError } from '../_shared/errors';

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const householdId = getPathParam(event.pathParameters, 'householdId');
    requireHouseholdAccess(user, householdId);
    const recipeId = getPathParam(event.pathParameters, 'recipeId');
    const recipe = await getItem(`HH#${householdId}`, `RECIPE#${recipeId}`);
    if (!recipe) throw new NotFoundError('Recipe not found');
    return success(recipe);
  } catch (err) { return error(err); }
};
