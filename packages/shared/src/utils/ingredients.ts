/**
 * Ingredient normalization utilities.
 * Strips quantities, units, modifiers, and prep instructions for clean store search.
 * Carried from the prototype's H-E-B integration logic.
 */

/** Words to strip from ingredient names for search queries */
const STRIP_MODIFIERS = [
  'boneless', 'skinless', 'bone-in', 'skin-on', 'trimmed', 'chopped',
  'diced', 'minced', 'sliced', 'shredded', 'grated', 'crushed',
  'ground', 'fresh', 'frozen', 'dried', 'canned', 'raw', 'cooked',
  'melted', 'softened', 'room temperature', 'cold', 'warm', 'hot',
  'large', 'medium', 'small', 'thin', 'thick', 'fine', 'coarse',
  'roughly', 'finely', 'thinly', 'thickly',
  'to taste', 'optional', 'divided', 'plus more', 'for garnish',
  'for serving', 'for topping', 'as needed',
  'approximately', 'about', 'heaping', 'scant', 'packed', 'loosely packed',
];

/** Common measurement units to strip */
const UNITS = [
  'cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons', 'tsp',
  'ounce', 'ounces', 'oz', 'pound', 'pounds', 'lb', 'lbs',
  'gram', 'grams', 'g', 'kilogram', 'kilograms', 'kg',
  'ml', 'milliliter', 'milliliters', 'liter', 'liters', 'l',
  'quart', 'quarts', 'qt', 'pint', 'pints', 'pt', 'gallon', 'gallons', 'gal',
  'pinch', 'dash', 'handful', 'bunch', 'sprig', 'sprigs', 'clove', 'cloves',
  'can', 'cans', 'jar', 'jars', 'package', 'packages', 'bag', 'bags',
  'piece', 'pieces', 'slice', 'slices', 'head', 'heads', 'stalk', 'stalks',
];

/**
 * Normalize an ingredient for store search.
 * "2 lbs boneless skinless chicken breast, trimmed" → "chicken breast"
 */
export function normalizeIngredientForSearch(original: string): string {
  let text = original.toLowerCase().trim();

  // Remove parenthetical content: "(about 2 cups)"
  text = text.replace(/\(.*?\)/g, '');

  // Remove leading numbers and fractions: "2 1/2", "1.5", "½"
  text = text.replace(/^[\d\s/.½⅓⅔¼¾⅛⅜⅝⅞-]+/, '');

  // Remove units
  const unitPattern = new RegExp(`^(${UNITS.join('|')})\\b\\.?\\s*`, 'i');
  text = text.replace(unitPattern, '');

  // Remove "of" after units: "cup of flour" → "flour"
  text = text.replace(/^of\s+/, '');

  // Remove modifiers
  for (const mod of STRIP_MODIFIERS) {
    text = text.replace(new RegExp(`\\b${mod}\\b`, 'gi'), '');
  }

  // Remove everything after comma (prep instructions): "chicken, cut into cubes"
  const commaIdx = text.indexOf(',');
  if (commaIdx > 2) {
    text = text.substring(0, commaIdx);
  }

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Generate a store search URL from a template and ingredient.
 * Template uses {ingredient} placeholder.
 */
export function buildStoreSearchUrl(template: string, ingredientName: string): string {
  const normalized = normalizeIngredientForSearch(ingredientName);
  return template.replace('{ingredient}', encodeURIComponent(normalized));
}

/**
 * Consolidate duplicate ingredients across multiple recipes.
 * Keys on (normalized name, normalized unit) and sums amounts.
 */
export interface ConsolidatedIngredient {
  name: string;
  totalAmount: number;
  unit: string;
  aisle: string;
  originalStrings: string[];
}

export function consolidateIngredients(
  ingredients: { name: string; amount: number; unit: string; aisle: string; original: string }[]
): ConsolidatedIngredient[] {
  const map = new Map<string, ConsolidatedIngredient>();

  for (const ing of ingredients) {
    const key = `${ing.name.toLowerCase().trim()}|${ing.unit.toLowerCase().trim()}`;
    const existing = map.get(key);

    if (existing) {
      existing.totalAmount += ing.amount;
      existing.originalStrings.push(ing.original);
    } else {
      map.set(key, {
        name: ing.name,
        totalAmount: ing.amount,
        unit: ing.unit,
        aisle: ing.aisle,
        originalStrings: [ing.original],
      });
    }
  }

  return Array.from(map.values());
}
