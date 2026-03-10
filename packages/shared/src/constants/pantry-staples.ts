/**
 * Pantry staple keywords.
 * Ingredients matching these keywords are separated into a "Pantry Check" section
 * in the grocery list — things you likely already have at home.
 * Carried from the Family Meal Planner prototype (~150 keywords).
 */

export const PANTRY_STAPLES: string[] = [
  // Oils & fats
  'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil',
  'avocado oil', 'cooking spray', 'butter', 'ghee',

  // Vinegars
  'vinegar', 'balsamic vinegar', 'red wine vinegar', 'white wine vinegar',
  'apple cider vinegar', 'rice vinegar',

  // Sauces & condiments
  'soy sauce', 'fish sauce', 'worcestershire', 'hot sauce', 'sriracha',
  'ketchup', 'mustard', 'mayo', 'mayonnaise', 'honey', 'maple syrup',
  'molasses', 'tahini',

  // Spices & seasonings
  'salt', 'pepper', 'black pepper', 'kosher salt', 'sea salt',
  'garlic powder', 'onion powder', 'cumin', 'paprika', 'smoked paprika',
  'chili powder', 'cayenne', 'oregano', 'basil', 'thyme', 'rosemary',
  'cinnamon', 'nutmeg', 'turmeric', 'coriander', 'cardamom', 'cloves',
  'allspice', 'bay leaf', 'bay leaves', 'italian seasoning', 'curry powder',
  'garam masala', 'red pepper flakes', 'crushed red pepper',
  'vanilla extract', 'almond extract',

  // Baking
  'flour', 'all-purpose flour', 'sugar', 'granulated sugar', 'brown sugar',
  'powdered sugar', 'confectioners sugar', 'baking soda', 'baking powder',
  'cornstarch', 'yeast', 'cocoa powder', 'vanilla',

  // Grains & pasta
  'rice', 'white rice', 'brown rice', 'pasta', 'spaghetti',
  'breadcrumbs', 'panko',

  // Canned & shelf-stable
  'broth', 'chicken broth', 'beef broth', 'vegetable broth',
  'stock', 'chicken stock', 'beef stock',
  'tomato paste', 'tomato sauce', 'canned tomatoes', 'diced tomatoes',
  'crushed tomatoes', 'coconut milk',

  // Nuts & seeds
  'sesame seeds', 'poppy seeds',

  // Other pantry items
  'peanut butter', 'jam', 'jelly', 'coffee', 'tea',
  'dried herbs', 'bouillon', 'bouillon cube',
];

/**
 * Check if an ingredient is likely a pantry staple.
 * Uses partial matching — "olive oil extra virgin" matches "olive oil".
 */
export function isPantryStaple(ingredientName: string): boolean {
  const lower = ingredientName.toLowerCase().trim();
  return PANTRY_STAPLES.some(
    (staple) => lower.includes(staple) || staple.includes(lower)
  );
}
