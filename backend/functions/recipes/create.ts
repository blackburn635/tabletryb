/** POST /v1/households/{householdId}/recipes — Create a recipe manually */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser, requireHouseholdAccess } from '../_shared/auth';
import { putItem, generateId } from '../_shared/dynamo';
import { created, error, parseBody, getPathParam } from '../_shared/response';
import type { Recipe } from '@tabletryb/shared';

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const householdId = getPathParam(event.pathParameters, 'householdId');
    requireHouseholdAccess(user, householdId);
    const body = parseBody<Partial<Recipe>>(event.body);
    const recipeId = generateId();
    const now = new Date().toISOString();
    const recipe = {
      PK: `HH#${householdId}`, SK: `RECIPE#${recipeId}`,
      GSI1PK: `HH#${householdId}#RECIPE`, GSI1SK: (body.title || '').toLowerCase(),
      recipeId, householdId, ...body,
      source: body.source || 'manual',
      createdBy: user.userId, createdAt: now, updatedAt: now,
    };
    await putItem(recipe);
    return created({ recipeId, ...body });
  } catch (err) { return error(err); }
};
