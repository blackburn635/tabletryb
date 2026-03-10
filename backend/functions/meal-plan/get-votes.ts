/** Meal plan: get-votes — see API.md for endpoint details */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser, requireHouseholdAccess } from '../_shared/auth';
import { success, error, getPathParam } from '../_shared/response';

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const householdId = getPathParam(event.pathParameters, 'householdId');
    requireHouseholdAccess(user, householdId);
    // TODO: Implement get-votes logic (port from prototype)
    return success({ message: 'Not yet implemented: meal-plan/get-votes' });
  } catch (err) { return error(err); }
};
