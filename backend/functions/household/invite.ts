/** POST /v1/households/{householdId}/invite — Send invite email (admin only) */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { getAuthUser, requireHouseholdPrimary } from '../_shared/auth';
import { putItem, getItem, generateId } from '../_shared/dynamo';
import { created, error, parseBody, getPathParam } from '../_shared/response';
import { NotFoundError, BadRequestError } from '../_shared/errors';
import { BRAND, type InviteMemberRequest } from '@tabletryb/shared';

const ses = new SESClient({});

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const householdId = getPathParam(event.pathParameters, 'householdId');
    requireHouseholdPrimary(user, householdId);

    const body = parseBody<InviteMemberRequest>(event.body);
    if (!body.email) throw new BadRequestError('Email is required');

    const household = await getItem(`HH#${householdId}`, 'META');
    if (!household) throw new NotFoundError('Household not found');

    const token = generateId(32);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await putItem({
      PK: `INVITE#${token}`, SK: 'INVITE',
      GSI1PK: `HH#${householdId}#INV`, GSI1SK: body.email,
      token, householdId,
      householdName: (household as Record<string, unknown>).name,
      email: body.email, displayName: body.displayName,
      invitedBy: user.userId, invitedByName: user.displayName,
      role: body.role || 'member', status: 'pending',
      createdAt: now.toISOString(), expiresAt: expiresAt.toISOString(),
      ttl: Math.floor(expiresAt.getTime() / 1000),
    });

    const inviteUrl = `https://${BRAND.domain}/accept-invite/${token}`;
    await ses.send(new SendEmailCommand({
      Source: BRAND.noReplyEmail,
      Destination: { ToAddresses: [body.email] },
      Message: {
        Subject: { Data: `You're invited to join ${(household as Record<string, unknown>).name} on ${BRAND.name}` },
        Body: { Html: { Data: `
          <h2>You've been invited!</h2>
          <p>${user.displayName} has invited you to join <strong>${(household as Record<string, unknown>).name}</strong> on ${BRAND.name}.</p>
          <p><a href="${inviteUrl}" style="background:#2D6A4F;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Accept Invitation</a></p>
          <p>This invitation expires in 7 days.</p>
        ` } },
      },
    }));

    return created({ token, email: body.email, expiresAt: expiresAt.toISOString() });
  } catch (err) { return error(err); }
};
