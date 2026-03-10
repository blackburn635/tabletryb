/** POST /v1/invites/{token} — Accept an invitation to join a household */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getAuthUser } from '../_shared/auth';
import { getItem, putItem, deleteItem } from '../_shared/dynamo';
import { success, error, getPathParam } from '../_shared/response';
import { NotFoundError, BadRequestError, ConflictError } from '../_shared/errors';

const cognito = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID!;

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const token = getPathParam(event.pathParameters, 'token');
    if (user.householdId) throw new ConflictError('You already belong to a household');

    const invite = await getItem(`INVITE#${token}`, 'INVITE') as Record<string, unknown> | null;
    if (!invite) throw new NotFoundError('Invitation not found or expired');
    if (invite.status !== 'pending') throw new BadRequestError('Invitation already used');
    if (new Date(invite.expiresAt as string) < new Date()) throw new BadRequestError('Invitation expired');

    const householdId = invite.householdId as string;
    const now = new Date().toISOString();

    // Add member to household
    await putItem({
      PK: `HH#${householdId}`, SK: `MEMBER#${user.userId}`,
      GSI1PK: `USER#${user.userId}`, GSI1SK: `HH#${householdId}`,
      userId: user.userId, email: user.email,
      displayName: (invite.displayName as string) || user.displayName,
      role: invite.role || 'member', joinedAt: now,
    });

    // Update Cognito
    await cognito.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID, Username: user.userId,
      UserAttributes: [
        { Name: 'custom:householdId', Value: householdId },
        { Name: 'custom:role', Value: (invite.role as string) || 'member' },
      ],
    }));

    // Mark invite as accepted
    await putItem({ ...(invite as Record<string, unknown>), status: 'accepted', acceptedAt: now, acceptedBy: user.userId });

    return success({ householdId, householdName: invite.householdName, role: invite.role });
  } catch (err) { return error(err); }
};
