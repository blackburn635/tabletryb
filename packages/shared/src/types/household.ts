/**
 * Household and member types.
 *
 * Role model:
 *   - "primary" — can finalize votes, manage settings, invite users, view grocery list
 *   - "member"  — can vote, view recipes, view meal selections
 *
 * Account holder: the user who signed up and created the household.
 *   - Always a primary user
 *   - Only they can manage the Chargebee subscription / billing
 *   - Stored as `isAccountHolder: true` on their membership record
 */

export type MemberRole = 'primary' | 'member';

export interface HouseholdMember {
  userId: string;
  email: string;
  displayName: string;
  role: MemberRole;
  /** True only for the original subscriber who created the household */
  isAccountHolder: boolean;
  joinedAt: string; // ISO 8601
}

export interface Household {
  householdId: string;
  name: string;
  createdBy: string; // userId of the account holder
  createdAt: string;
  updatedAt: string;
  members: HouseholdMember[];
  maxMembers: number; // Default 8
}

export interface HouseholdSettings {
  householdId: string;
  dietaryPreferences: string[];
  excludedIngredients: string[];
  defaultServings: number;
  /** How many recipes to show on the selection/voting page */
  mealsPerSelection: number; // Default 20
  /** Day of week the selection resets (0=Sun .. 5=Fri .. 6=Sat) */
  resetDay: number; // Default 5 (Friday)
  /** How often selections reset */
  resetFrequency: 'weekly' | 'biweekly' | 'monthly'; // Default 'weekly'
  /** Up to 3 grocery store IDs from SUPPORTED_STORES */
  groceryStoreIds: string[]; // Max 3
  updatedAt: string;
}

export interface Invitation {
  token: string;
  householdId: string;
  householdName: string;
  email: string;
  invitedBy: string;
  invitedByName: string;
  role: MemberRole;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
}

export interface CreateHouseholdRequest {
  name: string;
  defaultServings?: number;
  mealsPerSelection?: number;
}

export interface InviteMemberRequest {
  email: string;
  displayName: string;
  role: MemberRole;
}
