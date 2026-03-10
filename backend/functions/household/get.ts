/**
 * GET /v1/households/{householdId}
 * Returns household metadata and member list.
 */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser, requireHouseholdAccess } from '../_shared/auth';
import { getItem, queryByPK } from '../_shared/dynamo';
import { success, error, getPathParam } from '../_shared/response';
import { NotFoundError } from '../_shared/errors';

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const householdId = getPathParam(event.pathParameters, 'householdId');
    requireHouseholdAccess(user, householdId);

    const meta = await getItem(`HH#${householdId}`, 'META');
    if (!meta) throw new NotFoundError('Household not found');

    const members = await queryByPK(`HH#${householdId}`, 'MEMBER#');
    const settings = await getItem(`HH#${householdId}`, 'SETTINGS');
    const stores = await queryByPK(`HH#${householdId}`, 'STORE#');

    return success({
      ...(meta as Record<string, unknown>),
      members,
      settings,
      stores,
    });
  } catch (err) {
    return error(err);
  }
};
