/**
 * POST /v1/households/{householdId}/recipes/analyze
 * Claude AI recipe extraction from photos or URLs.
 * Ported from the prototype's analyze-recipe Lambda (Python → TypeScript).
 *
 * Two modes:
 *   1. Photo: Base64 image → Claude vision API → structured recipe JSON
 *   2. URL: Fetch page → strip HTML → Claude text API → structured recipe JSON
 *
 * Returns extracted data WITHOUT auto-saving — user reviews in RecipeEditForm first.
 */

import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthUser, requireHouseholdAccess } from '../_shared/auth';
import { success, error, parseBody, getPathParam } from '../_shared/response';
import { BadRequestError } from '../_shared/errors';
import type { AnalyzeRecipeRequest, AnalyzeRecipeResponse } from '@tabletryb/shared';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * System prompt for recipe extraction.
 * Requests ONLY valid JSON — no markdown, no backticks, no explanation.
 * Includes detailed instructions for ingredient aisle categorization.
 */
const EXTRACTION_PROMPT = `You are a recipe extraction assistant. Extract the recipe from the provided content and return ONLY valid JSON with no other text, no markdown backticks, no explanation.

Return this exact JSON structure:
{
  "title": "Recipe Title",
  "readyInMinutes": 45,
  "servings": 4,
  "summary": "Brief 1-2 sentence description of the dish",
  "cuisines": ["Italian"],
  "dishTypes": ["main course", "dinner"],
  "diets": [],
  "ingredients": [
    {
      "name": "chicken breast",
      "amount": 2,
      "unit": "lb",
      "original": "2 lbs boneless skinless chicken breast",
      "aisle": "Meat & Seafood"
    }
  ],
  "instructions": [
    { "number": 1, "step": "Preheat oven to 375°F." },
    { "number": 2, "step": "Season chicken with salt and pepper." }
  ]
}

Aisle categories (use exactly these names):
- Produce (fruits, vegetables, fresh herbs)
- Meat & Seafood (chicken, beef, pork, fish, shrimp)
- Dairy & Eggs (milk, cheese, butter, eggs, cream)
- Deli (sliced meats, prepared foods)
- Bakery & Bread (bread, tortillas, rolls)
- Canned & Jarred (canned beans, tomato sauce, broth)
- Pasta & Grains (pasta, rice, quinoa, oats)
- Sauces & Condiments (soy sauce, ketchup, mustard)
- Oils & Vinegars (olive oil, vinegar)
- Spices & Seasonings (salt, pepper, cumin, paprika)
- Baking (flour, sugar, baking powder)
- Frozen (frozen vegetables, ice cream)
- Snacks (chips, nuts, crackers)
- Beverages (juice, wine for cooking)
- Other (anything that doesn't fit above)

Rules:
- For "amount", use a number (decimals OK). If no amount given, use 1.
- For "unit", use standard abbreviations: lb, oz, cup, tbsp, tsp, etc. Use empty string "" for items counted by piece (e.g., 3 eggs).
- For "original", include the full original text of the ingredient line.
- Estimate readyInMinutes if not explicitly stated.
- For diets, only include if clearly applicable: "vegetarian", "vegan", "gluten-free", "dairy-free", "keto", "paleo".
- Return ONLY the JSON object. No other text.`;

/** Shape of a Claude API response */
interface ClaudeResponse {
  content?: Array<{ type: string; text?: string }>;
}

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const householdId = getPathParam(event.pathParameters, 'householdId');
    requireHouseholdAccess(user, householdId);

    const body = parseBody<AnalyzeRecipeRequest>(event.body);

    let extractedRecipe: AnalyzeRecipeResponse;

    if (body.type === 'photo') {
      extractedRecipe = await analyzePhoto(body);
    } else if (body.type === 'url') {
      extractedRecipe = await analyzeUrl(body);
    } else {
      throw new BadRequestError('Invalid analysis type. Use "photo" or "url".');
    }

    return success(extractedRecipe);
  } catch (err) {
    return error(err);
  }
};

/** Analyze a photo using Claude's vision API */
async function analyzePhoto(body: AnalyzeRecipeRequest): Promise<AnalyzeRecipeResponse> {
  if (!body.imageData || !body.imageMimeType) {
    throw new BadRequestError('imageData and imageMimeType are required for photo analysis');
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: body.imageMimeType,
                data: body.imageData,
              },
            },
            {
              type: 'text',
              text: 'Extract the recipe from this image.',
            },
          ],
        },
      ],
      system: EXTRACTION_PROMPT,
    }),
  });

  return parseClaudeResponse(response);
}

/** Analyze a URL by fetching the page and sending text to Claude */
async function analyzeUrl(body: AnalyzeRecipeRequest): Promise<AnalyzeRecipeResponse> {
  if (!body.url) {
    throw new BadRequestError('url is required for URL analysis');
  }

  // Fetch the page content
  const pageResponse = await fetch(body.url, {
    headers: {
      'User-Agent': 'TableTryb Recipe Importer/1.0',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!pageResponse.ok) {
    throw new BadRequestError(`Failed to fetch URL: ${pageResponse.status}`);
  }

  let pageText = await pageResponse.text();

  // Strip HTML tags, keep text content
  pageText = pageText
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate to ~8000 chars to stay within token limits
  if (pageText.length > 8000) {
    pageText = pageText.substring(0, 8000);
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Extract the recipe from this webpage content:\n\n${pageText}`,
        },
      ],
      system: EXTRACTION_PROMPT,
    }),
  });

  const recipe = await parseClaudeResponse(response);
  recipe.sourceUrl = body.url;
  return recipe;
}

/** Parse Claude API response and extract JSON */
async function parseClaudeResponse(response: Response): Promise<AnalyzeRecipeResponse> {
  if (!response.ok) {
    const errText = await response.text();
    console.error('Claude API error:', response.status, errText);
    throw new BadRequestError(`Claude API error: ${response.status}`);
  }

  const data = await response.json() as ClaudeResponse;
  const textContent = data.content?.find((c) => c.type === 'text');

  if (!textContent?.text) {
    throw new BadRequestError('No response from Claude');
  }

  // Clean potential markdown backticks (shouldn't happen with our prompt, but defensive)
  let jsonText = textContent.text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const recipe = JSON.parse(jsonText) as AnalyzeRecipeResponse;

    // Default missing fields
    recipe.image = recipe.image || '';
    recipe.readyInMinutes = recipe.readyInMinutes || 30;
    recipe.servings = recipe.servings || 4;
    recipe.summary = recipe.summary || '';
    recipe.cuisines = recipe.cuisines || [];
    recipe.dishTypes = recipe.dishTypes || ['main course'];
    recipe.diets = recipe.diets || [];
    recipe.ingredients = recipe.ingredients || [];
    recipe.instructions = recipe.instructions || [];

    return recipe;
  } catch {
    console.error('Failed to parse Claude JSON:', jsonText.substring(0, 500));
    throw new BadRequestError('Failed to parse recipe from AI response');
  }
}