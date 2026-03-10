/**
 * Recipe types — consistent across the entire app.
 * Matches the proven data model from the Family Meal Planner prototype.
 */

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  original: string; // Raw ingredient string (e.g., "2 lbs boneless skinless chicken breast")
  aisle: string; // Store aisle category (Produce, Meat, Dairy, etc.)
}

export interface Instruction {
  number: number;
  step: string;
}

export type RecipeSource = 'manual' | 'claude-photo' | 'claude-url' | 'import';

export interface Recipe {
  recipeId: string;
  householdId: string;
  title: string;
  image: string; // URL — S3 presigned, external, or placeholder
  readyInMinutes: number;
  servings: number;
  sourceUrl?: string; // Original recipe URL (if imported from URL)
  summary: string;
  cuisines: string[];
  dishTypes: string[]; // e.g., "main course", "side dish", "dessert"
  diets: string[]; // e.g., "vegetarian", "gluten-free"
  ingredients: Ingredient[];
  instructions: Instruction[];
  source: RecipeSource;
  createdBy: string; // userId who added the recipe
  createdAt: string; // ISO 8601
  updatedAt: string;
}

/** Minimal recipe reference used in meal plans (avoids duplicating full recipe data) */
export interface RecipeRef {
  recipeId: string;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  dishTypes: string[];
}

/** Request body for Claude AI recipe analysis */
export interface AnalyzeRecipeRequest {
  type: 'photo' | 'url';
  /** Base64-encoded image for photo analysis */
  imageData?: string;
  /** Image MIME type (image/jpeg, image/png, etc.) */
  imageMimeType?: string;
  /** Recipe URL for URL-based extraction */
  url?: string;
}

/** Response from Claude AI recipe analysis — user reviews before saving */
export interface AnalyzeRecipeResponse {
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl?: string;
  summary: string;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  ingredients: Ingredient[];
  instructions: Instruction[];
}
