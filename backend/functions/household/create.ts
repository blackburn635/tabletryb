/**
 * POST /v1/households
 * Creates a new household — the user becomes both account holder and primary user.
 *
 * Member record now stores firstName and lastName alongside displayName.
 */

import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getAuthUser } from '../_shared/auth';
import { putItem, generateId, TABLE_NAME } from '../_shared/dynamo';
import { created, error, parseBody } from '../_shared/response';
import { ConflictError } from '../_shared/errors';
import type { CreateHouseholdRequest } from '@tabletryb/shared';

const cognito = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID!;

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);

    if (user.householdId) {
      throw new ConflictError('You already belong to a household');
    }

    const body = parseBody<CreateHouseholdRequest>(event.body);
    const householdId = generateId();
    const now = new Date().toISOString();

    // Create household metadata
    await putItem({
      PK: `HH#${householdId}`,
      SK: 'META',
      householdId,
      name: body.name,
      createdBy: user.userId,
      createdAt: now,
      updatedAt: now,
      maxMembers: 8,
    });

    // Create the creator's membership — account holder + primary user
    await putItem({
      PK: `HH#${householdId}`,
      SK: `MEMBER#${user.userId}`,
      GSI1PK: `USER#${user.userId}`,
      GSI1SK: `HH#${householdId}`,
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      role: 'primary',
      isAccountHolder: true,
      joinedAt: now,
    });

    // Create default settings
    await putItem({
      PK: `HH#${householdId}`,
      SK: 'SETTINGS',
      householdId,
      dietaryPreferences: [],
      excludedIngredients: [],
      defaultServings: body.defaultServings || 4,
      mealsPerSelection: body.mealsPerSelection || 20,
      resetDay: 5, // Friday
      resetFrequency: 'weekly',
      groceryStoreIds: [],
      updatedAt: now,
    });

    // Update Cognito user attributes
    await cognito.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: user.userId,
        UserAttributes: [
          { Name: 'custom:householdId', Value: householdId },
          { Name: 'custom:role', Value: 'primary' },
        ],
      })
    );

    return created({
      householdId,
      name: body.name,
      role: 'primary',
      isAccountHolder: true,
      message: 'Household created. Next: set up your subscription.',
    });
  } catch (err) {
    return error(err);
  }
};
