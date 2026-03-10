/**
 * Meal plan types — weekly plan generation, voting, and finalization.
 * Carries the proven voting + finalization workflow from the prototype.
 */

import { RecipeRef } from './recipe';

export type WeekStatus = 'draft' | 'voting' | 'finalized';

export interface WeeklyPlan {
  householdId: string;
  weekId: string; // ISO week: "2026-W10"
  status: WeekStatus;
  meals: MealSlot[];
  createdAt: string;
  finalizedAt?: string;
  finalizedBy?: string; // userId of admin who finalized
}

export interface MealSlot {
  mealId: string;
  recipe: RecipeRef;
  addedAt: string;
}

export type VoteValue = 'up' | 'down' | null;

export interface MemberVotes {
  householdId: string;
  weekId: string;
  userId: string;
  displayName: string;
  votes: Record<string, VoteValue>; // mealId → vote
  updatedAt: string;
}

export interface CastVoteRequest {
  mealId: string;
  vote: VoteValue;
}

export interface VoteSummary {
  mealId: string;
  recipeTitle: string;
  upVotes: number;
  downVotes: number;
  voters: {
    displayName: string;
    vote: VoteValue;
  }[];
}

export interface FinalizeRequest {
  mealIds: string[]; // The meals selected by the admin
}

export interface GeneratePlanRequest {
  /** Number of meals to include (default from household settings) */
  count?: number;
  /** Specific recipe IDs to include */
  includeRecipeIds?: string[];
}
