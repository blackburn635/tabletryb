/** GET /v1/households/{householdId}/grocery-list/{weekId} */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser, requireHouseholdAccess } from '../_shared/auth';
import { success, error, getPathParam } from '../_shared/response';

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const householdId = getPathParam(event.pathParameters, 'householdId');
    const weekId = getPathParam(event.pathParameters, 'weekId');
    requireHouseholdAccess(user, householdId);
    // TODO: Implement grocery list generation (port from prototype)
    // 1. Get finalized meals for the week
    // 2. Collect all ingredients from recipe records
    // 3. Consolidate duplicates using shared/utils/ingredients.ts
    // 4. Split pantry staples using shared/constants/pantry-staples.ts
    // 5. Group by aisle using shared/constants/aisles.ts
    // 6. Generate store search URLs for household's configured stores
    return success({ message: 'Not yet implemented: grocery/generate-list', weekId });
  } catch (err) { return error(err); }
};
