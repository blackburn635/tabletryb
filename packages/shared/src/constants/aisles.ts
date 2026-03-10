/**
 * Grocery aisle categories and sort order.
 * Ordered in a logical store-walk path (produce → meat → dairy → ... → spices).
 * Carried from the Family Meal Planner prototype.
 */

export interface AisleDefinition {
  name: string;
  sortOrder: number;
  keywords: string[]; // Keywords that map ingredients to this aisle
}

export const AISLES: AisleDefinition[] = [
  {
    name: 'Produce',
    sortOrder: 1,
    keywords: [
      'lettuce', 'tomato', 'onion', 'garlic', 'potato', 'carrot', 'celery',
      'pepper', 'broccoli', 'spinach', 'kale', 'cucumber', 'zucchini',
      'mushroom', 'avocado', 'lemon', 'lime', 'orange', 'apple', 'banana',
      'berry', 'strawberry', 'blueberry', 'grape', 'mango', 'pineapple',
      'cilantro', 'parsley', 'basil', 'mint', 'rosemary', 'thyme', 'dill',
      'ginger', 'jalapeño', 'serrano', 'habanero', 'shallot', 'scallion',
      'green onion', 'cabbage', 'corn', 'asparagus', 'squash', 'eggplant',
      'sweet potato', 'yam', 'radish', 'beet', 'turnip', 'artichoke',
      'cauliflower', 'peas', 'green beans', 'snap peas', 'bean sprouts',
      'bok choy', 'watercress', 'arugula', 'endive', 'fennel', 'leek',
    ],
  },
  {
    name: 'Meat & Seafood',
    sortOrder: 2,
    keywords: [
      'chicken', 'beef', 'pork', 'turkey', 'lamb', 'steak', 'ground beef',
      'ground turkey', 'ground pork', 'sausage', 'bacon', 'ham', 'ribs',
      'brisket', 'roast', 'tenderloin', 'chop', 'thigh', 'breast', 'wing',
      'drumstick', 'salmon', 'shrimp', 'tuna', 'cod', 'tilapia', 'halibut',
      'crab', 'lobster', 'scallop', 'clam', 'mussel', 'oyster', 'anchovy',
      'sardine', 'mahi', 'swordfish', 'trout', 'catfish', 'snapper',
      'prosciutto', 'pancetta', 'chorizo', 'bratwurst', 'kielbasa',
    ],
  },
  {
    name: 'Dairy & Eggs',
    sortOrder: 3,
    keywords: [
      'milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'sour cream',
      'cream cheese', 'cottage cheese', 'ricotta', 'mozzarella', 'cheddar',
      'parmesan', 'gruyère', 'gouda', 'brie', 'feta', 'goat cheese',
      'swiss cheese', 'provolone', 'monterey jack', 'colby', 'half and half',
      'heavy cream', 'whipping cream', 'buttermilk', 'crème fraîche',
      'mascarpone', 'ghee',
    ],
  },
  {
    name: 'Deli',
    sortOrder: 4,
    keywords: [
      'deli', 'sliced turkey', 'sliced ham', 'sliced chicken', 'salami',
      'pepperoni', 'roast beef', 'bologna', 'pastrami', 'hummus',
    ],
  },
  {
    name: 'Bakery & Bread',
    sortOrder: 5,
    keywords: [
      'bread', 'tortilla', 'pita', 'naan', 'baguette', 'ciabatta', 'roll',
      'bun', 'croissant', 'english muffin', 'bagel', 'flatbread',
      'cornbread', 'breadcrumb',
    ],
  },
  {
    name: 'Canned & Jarred',
    sortOrder: 6,
    keywords: [
      'canned', 'tomato sauce', 'tomato paste', 'diced tomatoes', 'crushed tomatoes',
      'beans', 'black beans', 'kidney beans', 'chickpeas', 'lentils',
      'coconut milk', 'coconut cream', 'broth', 'stock', 'soup',
      'olives', 'capers', 'artichoke hearts', 'roasted peppers',
      'chipotle in adobo', 'sun-dried tomatoes', 'pumpkin puree',
    ],
  },
  {
    name: 'Pasta & Grains',
    sortOrder: 7,
    keywords: [
      'pasta', 'spaghetti', 'penne', 'fettuccine', 'linguine', 'rigatoni',
      'macaroni', 'orzo', 'lasagna', 'rice', 'quinoa', 'couscous',
      'barley', 'farro', 'bulgur', 'polenta', 'grits', 'oats', 'noodle',
      'ramen', 'udon', 'soba', 'rice noodle', 'egg noodle',
    ],
  },
  {
    name: 'Sauces & Condiments',
    sortOrder: 8,
    keywords: [
      'soy sauce', 'fish sauce', 'oyster sauce', 'hoisin', 'sriracha',
      'hot sauce', 'ketchup', 'mustard', 'mayo', 'mayonnaise', 'bbq sauce',
      'worcestershire', 'vinegar', 'balsamic', 'teriyaki', 'salsa',
      'tahini', 'pesto', 'marinara', 'alfredo', 'enchilada sauce',
      'curry paste', 'miso paste', 'gochujang', 'sambal', 'chutney',
      'honey', 'maple syrup', 'molasses',
    ],
  },
  {
    name: 'Oils & Vinegars',
    sortOrder: 9,
    keywords: [
      'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil',
      'avocado oil', 'peanut oil', 'grapeseed oil', 'cooking spray',
      'red wine vinegar', 'white wine vinegar', 'apple cider vinegar',
      'rice vinegar', 'sherry vinegar',
    ],
  },
  {
    name: 'Spices & Seasonings',
    sortOrder: 10,
    keywords: [
      'salt', 'pepper', 'cumin', 'paprika', 'chili powder', 'oregano',
      'cinnamon', 'nutmeg', 'turmeric', 'cayenne', 'garlic powder',
      'onion powder', 'italian seasoning', 'bay leaf', 'coriander',
      'cardamom', 'cloves', 'allspice', 'curry powder', 'garam masala',
      'smoked paprika', 'red pepper flakes', 'sesame seeds', 'poppy seeds',
      'vanilla extract', 'almond extract',
    ],
  },
  {
    name: 'Baking',
    sortOrder: 11,
    keywords: [
      'flour', 'sugar', 'brown sugar', 'powdered sugar', 'baking soda',
      'baking powder', 'yeast', 'cornstarch', 'cocoa powder', 'chocolate chips',
      'vanilla', 'almond flour', 'coconut flour', 'cake mix',
    ],
  },
  {
    name: 'Frozen',
    sortOrder: 12,
    keywords: [
      'frozen', 'ice cream', 'frozen vegetables', 'frozen fruit',
      'frozen pizza', 'frozen dinner', 'puff pastry', 'pie crust',
      'frozen shrimp', 'frozen fish', 'frozen chicken',
    ],
  },
  {
    name: 'Snacks',
    sortOrder: 13,
    keywords: [
      'chips', 'crackers', 'pretzels', 'popcorn', 'nuts', 'almonds',
      'walnuts', 'pecans', 'cashews', 'peanuts', 'trail mix', 'granola',
      'granola bar', 'dried fruit', 'raisins', 'coconut flakes',
    ],
  },
  {
    name: 'Beverages',
    sortOrder: 14,
    keywords: [
      'juice', 'soda', 'water', 'sparkling water', 'tea', 'coffee',
      'wine', 'beer', 'lemonade', 'kombucha',
    ],
  },
  {
    name: 'Other',
    sortOrder: 99,
    keywords: [],
  },
];

/** Map an ingredient name to its aisle */
export function getAisleForIngredient(ingredientName: string): string {
  const lower = ingredientName.toLowerCase();
  for (const aisle of AISLES) {
    if (aisle.keywords.some((kw) => lower.includes(kw))) {
      return aisle.name;
    }
  }
  return 'Other';
}

/** Get aisle sort order */
export function getAisleSortOrder(aisleName: string): number {
  const aisle = AISLES.find((a) => a.name === aisleName);
  return aisle?.sortOrder ?? 99;
}
