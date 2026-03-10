/** POST /v1/households/{householdId}/grocery-list/{weekId}/cart-push */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser, requireHouseholdAccess } from '../_shared/auth';
import { success, error, getPathParam } from '../_shared/response';

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const householdId = getPathParam(event.pathParameters, 'householdId');
    requireHouseholdAccess(user, householdId);
    // TODO: Implement cart push via Kroger API
    return success({ message: 'Not yet implemented: grocery/cart-push' });
  } catch (err) { return error(err); }
};
