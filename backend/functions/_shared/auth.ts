/**
 * Auth utilities — extract user info from API Gateway JWT authorizer context.
 *
 * Cognito standard attributes mapped:
 *   given_name  → firstName
 *   family_name → lastName
 *   name        → displayName (preferred name)
 */

import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { ForbiddenError, UnauthorizedError } from './errors';

export interface AuthUser {
  userId: string; // Cognito sub
  email: string;
  firstName: string;
  lastName: string;
  /** Preferred name — used for display throughout the app */
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

  const firstName = (claims.given_name as string) || '';
  const lastName = (claims.family_name as string) || '';
  // Preferred name (Cognito "name") falls back to firstName, then email
  const displayName = (claims.name as string) || firstName || (claims.email as string) || 'User';

  return {
    userId: claims.sub as string,
    email: (claims.email as string) || '',
    firstName,
    lastName,
    displayName,
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

/** Verify the user is a primary user of their household */
export function requirePrimary(user: AuthUser): void {
  if (user.role !== 'primary') {
    throw new ForbiddenError('Only primary users can perform this action');
  }
}

/** Verify primary access for a specific household */
export function requireHouseholdPrimary(user: AuthUser, householdId: string): void {
  requireHouseholdAccess(user, householdId);
  requirePrimary(user);
}
