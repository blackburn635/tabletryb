# TableTryb — API Endpoints

**Base URL:** `https://{api-id}.execute-api.us-east-2.amazonaws.com`
**Auth:** JWT Bearer token from Cognito (unless noted as public)
**Format:** JSON request/response

---

## Public Routes (No Authentication)

| Method | Path | Lambda | Description |
|--------|------|--------|-------------|
| POST | `/v1/contact` | `contact/submit` | Contact form submission → SES email |
| POST | `/v1/webhooks/chargebee` | `subscription/chargebee-webhook` | Chargebee event processing (verified by webhook secret) |

## Household Management

| Method | Path | Lambda | Role | Description |
|--------|------|--------|------|-------------|
| POST | `/v1/households` | `household/create` | Any authenticated | Create household (user becomes account holder + primary) |
| GET | `/v1/households/{householdId}` | `household/get` | Member+ | Get household details, members, settings, stores |
| PUT | `/v1/households/{householdId}` | `household/update` | Primary | Update household name, settings |
| POST | `/v1/households/{householdId}/invite` | `household/invite` | Primary | Send email invitation via SES |
| POST | `/v1/invites/{token}` | `household/accept-invite` | Any authenticated | Accept invitation, join household |
| DELETE | `/v1/households/{householdId}/members/{userId}` | `household/remove-member` | Primary | Remove member, clear Cognito attributes |

## Recipes

| Method | Path | Lambda | Role | Description |
|--------|------|--------|------|-------------|
| POST | `/v1/households/{householdId}/recipes` | `recipes/create` | Member+ | Create recipe manually |
| GET | `/v1/households/{householdId}/recipes` | `recipes/list` | Member+ | List recipes (sorted by title via GSI1) |
| GET | `/v1/households/{householdId}/recipes/{recipeId}` | `recipes/get` | Member+ | Get single recipe with full details |
| PUT | `/v1/households/{householdId}/recipes/{recipeId}` | `recipes/update` | Member+ | Update recipe |
| DELETE | `/v1/households/{householdId}/recipes/{recipeId}` | `recipes/delete` | Primary | Delete recipe |
| POST | `/v1/households/{householdId}/recipes/analyze` | `recipes/analyze` | Member+ | Claude AI extraction (photo or URL) |

### Recipe Analyze Request Body

```json
// Photo scan
{
  "type": "photo",
  "imageData": "<base64-encoded-image>",
  "imageMimeType": "image/jpeg"
}

// URL import
{
  "type": "url",
  "url": "https://www.allrecipes.com/recipe/..."
}
```

Returns extracted recipe data for user review — does NOT auto-save.

## Meal Planning

| Method | Path | Lambda | Role | Description |
|--------|------|--------|------|-------------|
| POST | `/v1/households/{householdId}/meal-plans/generate` | `meal-plan/generate` | Member+ | Randomly select meals from recipe library |
| GET | `/v1/households/{householdId}/meal-plans/{weekId}` | `meal-plan/get` | Member+ | Get meals for a specific week |
| POST | `/v1/households/{householdId}/meal-plans/{weekId}/vote` | `meal-plan/vote` | Member+ | Cast or update a vote |
| GET | `/v1/households/{householdId}/meal-plans/{weekId}/votes` | `meal-plan/get-votes` | Member+ | Get all votes (visible to all members) |
| POST | `/v1/households/{householdId}/meal-plans/{weekId}/finalize` | `meal-plan/finalize` | Primary | Lock in meal selections for grocery list |

### Vote Request Body

```json
{
  "mealId": "abc123",
  "vote": "up"       // "up", "down", or null (clear vote)
}
```

### Finalize Request Body

```json
{
  "mealIds": ["meal1", "meal2", "meal3", "meal4", "meal5"]
}
```

## Grocery

| Method | Path | Lambda | Role | Description |
|--------|------|--------|------|-------------|
| GET | `/v1/households/{householdId}/grocery-list/{weekId}` | `grocery/generate-list` | Member+ | Generate consolidated grocery list |
| POST | `/v1/households/{householdId}/grocery-list/{weekId}/cart-push` | `grocery/cart-push` | Member+ | Push items to Kroger cart |

## Subscription
## Subscription

| Method | Path | Lambda | Role | Description |
|--------|------|--------|------|-------------|
| POST | `/v1/subscription/checkout` | `subscription/create-checkout` | Primary | Generate Chargebee hosted checkout URL |
| GET | `/v1/subscription/status` | `subscription/get-status` | Any authenticated | Current subscription status + trial days remaining |
| POST | `/v1/subscription/portal` | `subscription/create-portal` | Primary | Generate Chargebee customer portal session URL |

### Checkout Request Body

```json
{
  "planId": "TableTryb-USD-Monthly",
  "householdId": "abc123",
  "redirectUrl": "https://staging.tabletryb.com/app"
}
```

Returns `{ "checkoutUrl": "https://tabletryb-test.chargebee.com/..." }` — frontend redirects to this URL.

### Status Response

```json
{
  "status": "in_trial",
  "planId": null,
  "trialDaysRemaining": 12,
  "trialEndsAt": "2026-03-29T00:00:00Z",
  "currentPeriodEnd": null,
  "cancelAtPeriodEnd": false,
  "chargebeeCustomerId": null
}
```

When no Chargebee subscription exists, trial is calculated from household `createdAt + 14 days`.

### Portal Response

```json
{
  "portalUrl": "https://tabletryb-test.chargebeeportal.com/portal/access/..."
}
```

Frontend navigates to this URL in the same tab. Chargebee portal redirects back to `/app/profile` when done.

## Image Upload

| Method | Path | Lambda | Role | Description |
|--------|------|--------|------|-------------|
| POST | `/v1/households/{householdId}/images/presigned-url` | `image-upload/presigned-url` | Member+ | Get S3 presigned PUT URL for image upload |

## Stores

| Method | Path | Lambda | Role | Description |
|--------|------|--------|------|-------------|
| GET | `/v1/stores/supported` | `stores/list-supported` | Member+ | List all supported grocery stores with tiers |

---

## Error Response Format

All errors follow a consistent structure:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

| HTTP Status | Error Code | Meaning |
|-------------|-----------|---------|
| 400 | `BAD_REQUEST`, `MISSING_BODY`, `INVALID_JSON`, `VALIDATION` | Invalid input |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 402 | `SUBSCRIPTION_REQUIRED` | Active subscription needed |
| 403 | `FORBIDDEN` | Insufficient role (e.g., member trying primary action) |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Already exists (e.g., creating a second household) |
| 429 | `RATE_LIMIT` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

All error responses include CORS headers to prevent browser masking.

---

## Week ID Format

ISO 8601 week: `2026-W10` (year-Wweek). Used consistently in all meal plan and grocery list endpoints.
