/** GET /v1/households/{householdId}/recipes — List recipes (paginated, sorted by title) */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser, requireHouseholdAccess } from '../_shared/auth';
import { queryGSI } from '../_shared/dynamo';
import { success, error, getPathParam } from '../_shared/response';

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const householdId = getPathParam(event.pathParameters, 'householdId');
    requireHouseholdAccess(user, householdId);
    const recipes = await queryGSI('GSI1', 'GSI1PK', `HH#${householdId}#RECIPE`, undefined, 'GSI1SK');
    return success({ recipes, count: recipes.length });
  } catch (err) { return error(err); }
};
