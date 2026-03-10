/** DELETE /v1/households/{householdId}/members/{userId} — Remove a member (admin only) */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getAuthUser, requireHouseholdPrimary } from '../_shared/auth';
import { deleteItem } from '../_shared/dynamo';
import { noContent, error, getPathParam } from '../_shared/response';
import { BadRequestError } from '../_shared/errors';

const cognito = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID!;

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const householdId = getPathParam(event.pathParameters, 'householdId');
    const targetUserId = getPathParam(event.pathParameters, 'userId');
    requireHouseholdPrimary(user, householdId);
    if (targetUserId === user.userId) throw new BadRequestError('Cannot remove yourself');
    await deleteItem(`HH#${householdId}`, `MEMBER#${targetUserId}`);
    await cognito.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID, Username: targetUserId,
      UserAttributes: [{ Name: 'custom:householdId', Value: '' }, { Name: 'custom:role', Value: '' }],
    }));
    return noContent();
  } catch (err) { return error(err); }
};
