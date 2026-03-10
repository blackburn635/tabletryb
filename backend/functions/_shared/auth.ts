/**
 * Auth utilities — extract user info from API Gateway JWT authorizer context.
 */

import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { ForbiddenError, UnauthorizedError } from './errors';

export interface AuthUser {
  userId: string; // Cognito sub
  email: string;
  displayName: string;
  householdId: string | null;
  role: string | null; // 'primary' | 'member'
}

/** Extract authenticated user from JWT claims */
export function getAuthUser(event: APIGatewayProxyEventV2WithJWTAuthorizer): AuthUser {
  const claims = event.requestContext?.authorizer?.jwt?.claims;

  if (!claims || !claims.sub) {
    throw new UnauthorizedError('Missing authentication');
  }

  return {
    userId: claims.sub as string,
    email: (claims.email as string) || '',
    displayName: (claims.name as string) || (claims.email as string) || 'User',
    householdId: (claims['custom:householdId'] as string) || null,
    role: (claims['custom:role'] as string) || null,
  };
}

/**
 * Verify the user belongs to the household specified in the path.
 * Prevents cross-household data access.
 */
export function requireHouseholdAccess(user: AuthUser, householdId: string): void {
  if (!user.householdId || user.householdId !== householdId) {
    throw new ForbiddenError('You do not have access to this household');
  }
}

/** Verify the user is an admin of their household */
export function requirePrimary(user: AuthUser): void {
  if (user.role !== 'primary') {
    throw new ForbiddenError('Only household admins can perform this action');
  }
}

/** Verify admin access for a specific household */
export function requireHouseholdPrimary(user: AuthUser, householdId: string): void {
  requireHouseholdAccess(user, householdId);
  requirePrimary(user);
}
