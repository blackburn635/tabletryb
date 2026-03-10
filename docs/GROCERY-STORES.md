# TableTryb — Grocery Store Integrations

## Tiered Integration Model

Not all grocery stores have APIs. We support three integration levels, providing the best experience possible for each store:

| Tier | Integration | User Experience | Stores |
|------|------------|-----------------|--------|
| **Tier 1: Cart Push** | Full OAuth + cart API | "Add to Cart" button pushes items directly to the store | Kroger + subsidiaries |
| **Tier 2: Search Links** | URL-based search | Each item links to the store's search page | H-E-B, Walmart, Target, Costco, Whole Foods, Publix, Aldi, Trader Joe's, Safeway, Albertsons |
| **Tier 3: List Export** | Copy/share | Copy formatted list to Notes, Messages, etc. | Any store |

Every household can configure 1–3 preferred stores in Settings.

---

## Tier 1: Cart Push (Kroger Network)

Kroger has the most accessible grocery API. Their network covers ~2,800 stores across 35 states under multiple banners:

| Banner | Regions |
|--------|---------|
| Kroger | OH, KY, IN, MI, WV, GA, TN, SC, VA, TX, CO, AZ, NM, NV, OR, WA, AK |
| Ralphs | CA |
| Harris Teeter | NC, SC, VA, MD, DE, DC, FL, GA |
| Fred Meyer | OR, WA, ID, AK |

### Cart Push Flow

```
1. CONNECT (one-time per household)
   → User clicks "Connect Kroger" in Settings
   → Lambda generates Kroger OAuth URL
   → User authorizes TableTryb on Kroger's site
   → Callback stores refresh_token in DynamoDB (encrypted)

2. PUSH TO CART (each grocery cycle)
   → User clicks "Push to Cart" on grocery list
   → Lambda reads finalized grocery list
   → Maps ingredients to Kroger product UPCs (Kroger Product API search)
   → POST /cart/add with matched UPCs
   → Returns confirmation with match report
```

### Match Report

Cart push returns three categories:
- **Matched** — exact product found and added to cart
- **Fuzzy matched** — close match found (e.g., "chicken breast" → "Kroger Boneless Chicken Breast"), added with confidence score
- **Not found** — no match (e.g., specialty ingredients), user shops manually for these

---

## Tier 2: Search Links

For stores without cart APIs, each grocery item links to the store's search page. The user clicks the link, which opens the store's website with the ingredient pre-searched.

### Search URL Templates

```
H-E-B:        https://www.heb.com/search/?q={ingredient}
Walmart:      https://www.walmart.com/search?q={ingredient}
Target:       https://www.target.com/s?searchTerm={ingredient}
Costco:       https://www.costco.com/CatalogSearch?keyword={ingredient}
Whole Foods:  https://www.wholefoodsmarket.com/search?text={ingredient}
Publix:       https://www.publix.com/search?query={ingredient}
Aldi:         https://www.aldi.us/search/?q={ingredient}
Trader Joe's: https://www.traderjoes.com/home/search?q={ingredient}
Safeway:      https://www.safeway.com/shop/search-results.html?q={ingredient}
Albertsons:   https://www.albertsons.com/shop/search-results.html?q={ingredient}
```

### Ingredient Normalization for Search

Before generating search URLs, ingredients are cleaned to remove quantities, units, modifiers, and prep instructions:

```
Raw:        "2 lbs boneless skinless chicken breast, trimmed"
Normalized: "chicken breast"
Search URL: https://www.heb.com/search/?q=chicken%20breast
```

This reuses the same normalization logic from the prototype's H-E-B integration, now in `packages/shared/src/utils/ingredients.ts`.

---

## Tier 3: List Export

Available for all stores regardless of API availability:
- **Copy to clipboard** — formatted text list with checkboxes
- **Share** — native share sheet on mobile
- **Apple Notes** — formatted with `- ` prefixes that convert to checkboxes when pasted

---

## Household Store Configuration

Primary users select 1–3 stores during onboarding and can change them in Settings. Stored in DynamoDB:

```json
{
  "PK": "HH#abc123",
  "SK": "STORE#kroger",
  "storeId": "kroger",
  "displayName": "Kroger",
  "tier": "cart-push",
  "oauthConnected": true,
  "preferredLocationId": "70100456",
  "searchUrlTemplate": "https://www.kroger.com/search?query={ingredient}"
}
```

---

## Adding New Stores

To add a new store:

1. Add it to `SUPPORTED_STORES` in `packages/shared/src/types/grocery.ts`
2. If Tier 2 (search link), provide the `searchUrlTemplate`
3. If Tier 1 (cart push), implement OAuth + cart API integration in `backend/functions/stores/`
4. Optionally add a store logo SVG to `frontend/public/assets/stores/`

---

## Future Considerations

- **Instacart API** — covers many stores but API access requires partnership approval
- **Amazon Fresh / Whole Foods** — Amazon has no public grocery cart API
- **Regional chains** — Wegmans, Meijer, WinCo, etc. can be added as Tier 2 easily
- **H-E-B** — no public API, but if one becomes available, could upgrade from Tier 2 to Tier 1
