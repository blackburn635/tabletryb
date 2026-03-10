# TableTryb — DynamoDB Schema

**Table Name:** `tabletryb-{stage}` (e.g., `tabletryb-staging`, `tabletryb-prod`)
**Billing:** On-Demand (PAY_PER_REQUEST)
**Encryption:** AWS managed
**PITR:** Enabled
**TTL:** Enabled on `ttl` attribute

---

## Why DynamoDB

- **Proven** — single-table design handled all access patterns in the prototype
- **Cost** — on-demand billing scales to zero, free tier covers early growth. Cheaper than RDS/Aurora for key-value access patterns (no complex joins needed)
- **Lambda-friendly** — HTTP-based client, no connection pooling headaches
- **Multi-tenancy** — natural via `HH#<id>` partition prefix

**Rejected alternatives:**
- RDS/Aurora — connection pooling with Lambda is painful, minimum ~$15/mo idle costs
- Aurora Serverless v2 — minimum 0.5 ACU (~$43/mo), too expensive at launch
- Separate users table in RDS — unnecessary complexity, Cognito handles user management

---

## Table Design

### Primary Key
- **PK** (String) — Partition key
- **SK** (String) — Sort key

### Global Secondary Indexes

| Index | Partition Key | Sort Key | Purpose |
|-------|--------------|----------|---------|
| GSI1 | GSI1PK | GSI1SK | User → household lookup, recipe listing by title, week listing, invite lookup |
| GSI2 | GSI2PK | GSI2SK | Subscription status queries (admin dashboards, cleanup jobs) |

---

## Entity Schema

### Household Metadata
| Attribute | Value | Example |
|-----------|-------|---------|
| PK | `HH#<householdId>` | `HH#abc123def456` |
| SK | `META` | `META` |
| householdId | String | `abc123def456` |
| name | String | `The Blackburn Family` |
| createdBy | String (userId) | `cognito-sub-uuid` |
| createdAt | ISO 8601 | `2026-03-10T12:00:00Z` |
| updatedAt | ISO 8601 | |
| maxMembers | Number | `8` |

### Household Member
| Attribute | Value |
|-----------|-------|
| PK | `HH#<householdId>` |
| SK | `MEMBER#<userId>` |
| GSI1PK | `USER#<userId>` |
| GSI1SK | `HH#<householdId>` |
| userId | String |
| email | String |
| displayName | String |
| role | `"primary"` or `"member"` |
| isAccountHolder | Boolean (true only for the subscriber who created the household) |
| joinedAt | ISO 8601 |

### Household Settings
| Attribute | Value |
|-----------|-------|
| PK | `HH#<householdId>` |
| SK | `SETTINGS` |
| dietaryPreferences | String[] |
| excludedIngredients | String[] |
| defaultServings | Number (default: 4) |
| mealsPerSelection | Number (default: 20) |
| resetDay | Number, 0–6 (default: 5 = Friday) |
| resetFrequency | `"weekly"` / `"biweekly"` / `"monthly"` |
| groceryStoreIds | String[] (max 3 store IDs) |
| updatedAt | ISO 8601 |

### Recipe
| Attribute | Value |
|-----------|-------|
| PK | `HH#<householdId>` |
| SK | `RECIPE#<recipeId>` |
| GSI1PK | `HH#<householdId>#RECIPE` |
| GSI1SK | `<title_lowercase>` (for sorted listing) |
| recipeId | String |
| householdId | String |
| title | String |
| image | URL string |
| readyInMinutes | Number |
| servings | Number |
| sourceUrl | String (optional) |
| summary | String |
| cuisines | String[] |
| dishTypes | String[] |
| diets | String[] |
| ingredients | Ingredient[] (embedded) |
| instructions | Instruction[] (embedded) |
| source | `"manual"` / `"claude-photo"` / `"claude-url"` / `"import"` |
| createdBy | String (userId) |
| createdAt | ISO 8601 |
| updatedAt | ISO 8601 |

### Weekly Meal Plan Metadata
| Attribute | Value |
|-----------|-------|
| PK | `HH#<householdId>` |
| SK | `WEEK#<isoWeek>#META` |
| GSI1PK | `HH#<householdId>#WEEK` |
| GSI1SK | `<isoWeek>` |
| status | `"draft"` / `"voting"` / `"finalized"` |
| createdAt | ISO 8601 |
| finalizedAt | ISO 8601 (optional) |
| finalizedBy | String userId (optional) |

### Meal in Weekly Plan
| Attribute | Value |
|-----------|-------|
| PK | `HH#<householdId>` |
| SK | `WEEK#<isoWeek>#MEAL#<mealId>` |
| mealId | String |
| recipe | RecipeRef (embedded: recipeId, title, image, readyInMinutes, servings, dishTypes) |
| addedAt | ISO 8601 |

### Member Votes for a Week
| Attribute | Value |
|-----------|-------|
| PK | `HH#<householdId>` |
| SK | `WEEK#<isoWeek>#VOTE#<userId>` |
| userId | String |
| displayName | String |
| votes | Map: `{ mealId: "up" | "down" | null }` |
| updatedAt | ISO 8601 |

### Finalized Selections
| Attribute | Value |
|-----------|-------|
| PK | `HH#<householdId>` |
| SK | `WEEK#<isoWeek>#FINAL` |
| mealIds | String[] (selected meal IDs) |
| finalizedBy | String userId |
| finalizedAt | ISO 8601 |

### Grocery List (Cached)
| Attribute | Value |
|-----------|-------|
| PK | `HH#<householdId>` |
| SK | `WEEK#<isoWeek>#GROCERY` |
| generatedAt | ISO 8601 |
| items | GroceryItem[] (embedded) |

### Household Store Config
| Attribute | Value |
|-----------|-------|
| PK | `HH#<householdId>` |
| SK | `STORE#<storeId>` |
| storeId | String |
| displayName | String |
| tier | `"cart-push"` / `"search-link"` / `"export-only"` |
| searchUrlTemplate | String (optional) |
| oauthConnected | Boolean |
| preferredLocationId | String (optional) |

### Invitation
| Attribute | Value |
|-----------|-------|
| PK | `INVITE#<token>` |
| SK | `INVITE` |
| GSI1PK | `HH#<householdId>#INV` |
| GSI1SK | `<email>` |
| token | String (32 chars) |
| householdId | String |
| householdName | String |
| email | String |
| invitedBy | String userId |
| invitedByName | String |
| role | `"primary"` / `"member"` |
| status | `"pending"` / `"accepted"` / `"expired"` |
| createdAt | ISO 8601 |
| expiresAt | ISO 8601 |
| ttl | Number (epoch seconds, 7 days) |

### Subscription
| Attribute | Value |
|-----------|-------|
| PK | `SUB#<householdId>` |
| SK | `SUBSCRIPTION` |
| GSI2PK | `SUB#STATUS` |
| GSI2SK | `<status>#<householdId>` |
| householdId | String |
| chargebeeSubscriptionId | String |
| chargebeeCustomerId | String |
| status | `"in_trial"` / `"active"` / `"past_due"` / `"cancelled"` / `"expired"` |
| planId | String |
| trialStartedAt / trialEndsAt | ISO 8601 |
| currentPeriodStart / currentPeriodEnd | ISO 8601 |
| cancelledAt | ISO 8601 (optional) |
| updatedAt | ISO 8601 |
| ttl | Number (set on cancellation, 90 days) |

---

## Access Patterns

| Pattern | Query |
|---------|-------|
| Get household metadata | PK=`HH#<hhId>`, SK=`META` |
| List household members | PK=`HH#<hhId>`, SK begins_with `MEMBER#` |
| Find user's household | GSI1: PK=`USER#<userId>` |
| List recipes (sorted by title) | GSI1: PK=`HH#<hhId>#RECIPE` |
| Get single recipe | PK=`HH#<hhId>`, SK=`RECIPE#<recipeId>` |
| Get current week's meals | PK=`HH#<hhId>`, SK begins_with `WEEK#2026-W10#MEAL` |
| Get all votes for a week | PK=`HH#<hhId>`, SK begins_with `WEEK#2026-W10#VOTE` |
| Get household settings | PK=`HH#<hhId>`, SK=`SETTINGS` |
| Validate invite token | PK=`INVITE#<token>`, SK=`INVITE` |
| Check subscription status | PK=`SUB#<hhId>`, SK=`SUBSCRIPTION` |
| List subscriptions by status | GSI2: PK=`SUB#STATUS`, SK begins_with `active#` |
| List weeks for household | GSI1: PK=`HH#<hhId>#WEEK` |

---

*All entities use the `HH#<householdId>` prefix for multi-tenancy. No cross-household queries are possible without the household ID.*
