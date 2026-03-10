/**
 * Grocery list and store integration types.
 * Supports the three-tier integration model: Cart Push, Search Links, List Export.
 */

export type StoreTier = 'cart-push' | 'search-link' | 'export-only';

export interface GroceryStore {
  storeId: string;
  displayName: string;
  tier: StoreTier;
  logoUrl: string; // PLACEHOLDER: store logo
  searchUrlTemplate?: string; // e.g., "https://www.heb.com/search/?q={ingredient}"
  supportsOAuth?: boolean;
  oauthConnectUrl?: string;
  regions?: string[]; // US states/regions where available
}

/** A household's configured store with connection status */
export interface HouseholdStore {
  storeId: string;
  displayName: string;
  tier: StoreTier;
  searchUrlTemplate?: string;
  oauthConnected: boolean;
  preferredLocationId?: string; // For cart-push stores (specific store location)
  connectedAt?: string;
}

export interface GroceryItem {
  name: string; // Normalized ingredient name
  amount: number;
  unit: string;
  aisle: string;
  originalIngredients: string[]; // Raw strings from recipes (for reference)
  isPantryStaple: boolean;
  checked: boolean;
  /** Store search URLs for configured stores */
  storeLinks: {
    storeId: string;
    storeName: string;
    url: string;
  }[];
}

export interface GroceryList {
  householdId: string;
  weekId: string;
  generatedAt: string;
  items: GroceryItem[];
  /** Items grouped by aisle for display */
  aisleGroups: AisleGroup[];
  pantryCheck: GroceryItem[]; // Items user probably has
}

export interface AisleGroup {
  aisle: string;
  sortOrder: number;
  items: GroceryItem[];
}

export interface CartPushRequest {
  storeId: string;
  weekId: string;
}

export interface CartPushResult {
  storeId: string;
  matched: { ingredient: string; productName: string; productId: string }[];
  fuzzyMatched: { ingredient: string; productName: string; productId: string; confidence: number }[];
  notFound: string[];
  cartUrl?: string; // Deep link to store cart
}

/** All supported grocery stores (master list) */
export const SUPPORTED_STORES: GroceryStore[] = [
  // Tier 1: Cart Push
  {
    storeId: 'kroger',
    displayName: 'Kroger',
    tier: 'cart-push',
    logoUrl: '/assets/stores/kroger.svg', // PLACEHOLDER
    searchUrlTemplate: 'https://www.kroger.com/search?query={ingredient}',
    supportsOAuth: true,
    regions: ['OH', 'KY', 'IN', 'MI', 'WV', 'GA', 'TN', 'SC', 'VA', 'TX', 'CO', 'AZ', 'NM', 'NV', 'OR', 'WA', 'AK'],
  },
  {
    storeId: 'kroger-ralphs',
    displayName: 'Ralphs (Kroger)',
    tier: 'cart-push',
    logoUrl: '/assets/stores/ralphs.svg', // PLACEHOLDER
    searchUrlTemplate: 'https://www.ralphs.com/search?query={ingredient}',
    supportsOAuth: true,
    regions: ['CA'],
  },
  {
    storeId: 'kroger-harris-teeter',
    displayName: 'Harris Teeter (Kroger)',
    tier: 'cart-push',
    logoUrl: '/assets/stores/harris-teeter.svg', // PLACEHOLDER
    searchUrlTemplate: 'https://www.harristeeter.com/search?query={ingredient}',
    supportsOAuth: true,
    regions: ['NC', 'SC', 'VA', 'MD', 'DE', 'DC', 'FL', 'GA'],
  },
  {
    storeId: 'kroger-fred-meyer',
    displayName: 'Fred Meyer (Kroger)',
    tier: 'cart-push',
    logoUrl: '/assets/stores/fred-meyer.svg', // PLACEHOLDER
    searchUrlTemplate: 'https://www.fredmeyer.com/search?query={ingredient}',
    supportsOAuth: true,
    regions: ['OR', 'WA', 'ID', 'AK'],
  },

  // Tier 2: Search Links
  {
    storeId: 'heb',
    displayName: 'H-E-B',
    tier: 'search-link',
    logoUrl: '/assets/stores/heb.svg', // PLACEHOLDER
    searchUrlTemplate: 'https://www.heb.com/search/?q={ingredient}',
    regions: ['TX'],
  },
  {
    storeId: 'walmart',
    displayName: 'Walmart',
    tier: 'search-link',
    logoUrl: '/assets/stores/walmart.svg', // PLACEHOLDER
    searchUrlTemplate: 'https://www.walmart.com/search?q={ingredient}',
  },
  {
    storeId: 'target',
    displayName: 'Target',
    tier: 'search-link',
    logoUrl: '/assets/stores/target.svg', // PLACEHOLDER
    searchUrlTemplate: 'https://www.target.com/s?searchTerm={ingredient}',
  },
  {
    storeId: 'costco',
    displayName: 'Costco',
    tier: 'search-link',
    logoUrl: '/assets/stores/costco.svg', // PLACEHOLDER
    searchUrlTemplate: 'https://www.costco.com/CatalogSearch?keyword={ingredient}',
  },
  {
    storeId: 'whole-foods',
    displayName: 'Whole Foods',
    tier: 'search-link',
    logoUrl: '/assets/stores/whole-foods.svg', // PLACEHOLDER
    searchUrlTemplate: 'https://www.wholefoodsmarket.com/search?text={ingredient}',
  },
  {
    storeId: 'publix',
    displayName: 'Publix',
    tier: 'search-link',
    logoUrl: '/assets/stores/publix.svg', // PLACEHOLDER
    searchUrlTemplate: 'https://www.publix.com/search?query={ingredient}',
    regions: ['FL', 'GA', 'AL', 'SC', 'NC', 'TN', 'VA'],
  },
  {
    storeId: 'aldi',
    displayName: 'Aldi',
    tier: 'search-link',
    logoUrl: '/assets/stores/aldi.svg', // PLACEHOLDER
    searchUrlTemplate: 'https://www.aldi.us/search/?q={ingredient}',
  },
  {
    storeId: 'trader-joes',
    displayName: "Trader Joe's",
    tier: 'search-link',
    logoUrl: '/assets/stores/trader-joes.svg', // PLACEHOLDER
    searchUrlTemplate: 'https://www.traderjoes.com/home/search?q={ingredient}',
  },
  {
    storeId: 'safeway',
    displayName: 'Safeway',
    tier: 'search-link',
    logoUrl: '/assets/stores/safeway.svg', // PLACEHOLDER
    searchUrlTemplate: 'https://www.safeway.com/shop/search-results.html?q={ingredient}',
    regions: ['CA', 'OR', 'WA', 'AZ', 'CO', 'HI', 'MD', 'VA', 'DC'],
  },
  {
    storeId: 'albertsons',
    displayName: 'Albertsons',
    tier: 'search-link',
    logoUrl: '/assets/stores/albertsons.svg', // PLACEHOLDER
    searchUrlTemplate: 'https://www.albertsons.com/shop/search-results.html?q={ingredient}',
  },
];
