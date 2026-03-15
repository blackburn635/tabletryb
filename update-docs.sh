#!/bin/bash
# update-docs.sh — Update docs/ to reflect March 15, 2026 session changes.
#
# Changes documented:
#   1. Chargebee PC 2.0 migration (item price IDs, checkout endpoint)
#   2. customer[id] = householdId pattern (no custom fields needed)
#   3. Three-name-field signup (firstName, lastName, preferredName)
#   4. Local trial + Subscribe Now flow (no card upfront)
#   5. Trial banner, SubscribePage, billing portal
#   6. .env.staging requires export prefix
#   7. 26 Lambda functions (was 25 — added portal)
#   8. Monthly price $4.99 (was $5.99), save ~17% (was 30%)
#   9. Household member cap 50 (was 8 in docs)
#
# Usage:
#   chmod +x update-docs.sh
#   ./update-docs.sh

set -euo pipefail

DOCS_DIR="docs"

echo "Updating TableTryb documentation..."

# ============================================================================
# SUBSCRIPTION.md — Major overhaul
# ============================================================================
echo "→ Rewriting SUBSCRIPTION.md..."

cat > "$DOCS_DIR/SUBSCRIPTION.md" << 'SUBSCRIPTION_EOF'
# TableTryb — Subscription & Billing (Chargebee)

**Updated:** March 15, 2026

## Why Chargebee (Not Stripe Direct)

- **Subscription lifecycle** — trials, renewals, dunning (failed payment retries), cancellation flows handled automatically
- **Hosted checkout** — PCI-compliant payment pages without building payment forms
- **Customer portal** — users manage their own billing (update card, view invoices, cancel)
- **Webhook-driven** — all state changes pushed to our Lambda, DynamoDB is source of truth for access control

---

## Plan Structure (Chargebee Product Catalog 2.0)

Chargebee uses **item price IDs** (not plan IDs). Our test site (`tabletryb-test`) has one plan ("TableTryb") with two price points:

| Item Price ID | Price | Trial | Billing |
|--------------|-------|-------|---------|
| `TableTryb-USD-Monthly` | $4.99/mo | 14 days | Monthly |
| `TableTryb-USD-Yearly` | $49.99/yr (~$4.17/mo, save ~17%) | 14 days | Annual |

### Feature Access by Status

| Status | App Behavior |
|--------|-------------|
| `in_trial` | Full access + trial banner showing days remaining + Subscribe Now |
| `active` | Full access, no banner |
| `past_due` | Full access + yellow warning banner: "Payment failed" |
| `cancelled` | Read-only (view recipes, export grocery lists, no new imports/votes) |
| `expired` | Trial ended without subscribing — red banner, Subscribe to Continue |
| `none` | No household yet, redirect to onboarding |

---

## Key Design Decision: customer[id] = householdId

The Chargebee customer ID is set to the TableTryb householdId at checkout time:

```
'customer[id]': householdId
```

This means:
- Every webhook carries `subscription.customer_id` which IS the `householdId`
- No custom fields (`cf_household_id`) or `meta_data` needed
- The portal session is created with `customer[id] = householdId` directly
- Returning customers (resubscribe after cancel) reuse the same Chargebee customer

This is the cleanest integration pattern — Chargebee's customer model maps 1:1 to our household model.

---

## Subscription Flow

### 1. Sign Up → Local Trial (No Chargebee)

```
User signs up via Cognito → Creates household
  → Household createdAt = now
  → Trial is calculated locally: createdAt + 14 days
  → No Chargebee customer or subscription created yet
  → get-status Lambda checks for SUB# record, finds none,
    falls back to household.createdAt to calculate trial days remaining
```

### 2. Subscribe Now (Anytime During or After Trial)

```
Frontend: User clicks "Subscribe Now" in trial banner or /app/subscribe page
  → Picks Monthly or Annual plan

Frontend: POST /v1/subscription/checkout
  → { planId: "TableTryb-USD-Monthly", householdId: "abc123", redirectUrl: "/app" }

Lambda (create-checkout):
  → POST to Chargebee: checkout_new_for_items
  → Sets customer[id] = householdId (key linking mechanism)
  → Sets subscription_items[item_price_id][0] = planId
  → Returns hosted checkout URL

Frontend: Redirects to Chargebee hosted checkout
  → User enters payment details (test card: 4111 1111 1111 1111)
  → Chargebee redirects back to /app

Chargebee Webhook: subscription_created
  → Lambda reads subscription.customer_id (= householdId)
  → Writes SUB#<householdId> to DynamoDB
  → Status depends on Chargebee trial config (in_trial or active)
```

### 3. Trial Ends → Active (Chargebee-Managed Subscriptions)

```
Chargebee: Auto-charges card on file
Webhook: subscription_activated
  → Lambda updates DynamoDB status to "active"
```

### 4. Payment Fails

```
Chargebee: Retries per dunning config (days 1, 4, 8, then cancel)
Webhook: payment_failed
  → Lambda updates status to "past_due"
  → App shows yellow warning banner: "Payment failed — Update Payment"
```

### 5. User Cancels

```
User: Profile → Manage Subscription / Billing
  → Navigates to Chargebee customer portal (same tab)
  → Clicks cancel subscription
  → Returns to /app/profile via redirect_url

Webhook: subscription_cancelled
  → Lambda sets status to "cancelled"
  → Sets TTL (90 days) for data retention
  → App becomes read-only with grey banner
```

### 6. Subscription & Billing Portal

```
Frontend: Profile page → "Manage Subscription / Billing" button
  → POST /v1/subscription/portal

Lambda (create-portal):
  → Verifies SUB# record exists
  → POST to Chargebee: portal_sessions with customer[id] = householdId
  → Includes redirect_url back to /app/profile
  → Returns portal access_url

Frontend: window.location.href = portalUrl (same tab, not popup)
  → User manages billing in Chargebee portal
  → Chargebee "Back" link returns to /app/profile
```

---

## Frontend Components

### Trial Banner (`frontend/src/components/common/TrialBanner.tsx`)

Shown at the top of AppShell (between header and main content). Fetches `GET /v1/subscription/status` on mount.

| Status | Banner Style | Message | Button |
|--------|-------------|---------|--------|
| `in_trial` | Blue, dismissible | "X days left in your free trial" | Subscribe Now → /app/subscribe |
| `expired` | Red, non-dismissible | "Your free trial has ended" | Subscribe to Continue → /app/subscribe |
| `past_due` | Yellow, non-dismissible | "Payment failed" | Update Payment → /app/profile |
| `cancelled` | Grey, non-dismissible | "Subscription cancelled" | Resubscribe → /app/subscribe |
| `active` | Hidden | — | — |

### Subscribe Page (`frontend/src/pages/app/SubscribePage.tsx`)

Route: `/app/subscribe`. Shows two plan cards (Monthly / Annual) with features and a "Subscribe Now" button that triggers the Chargebee checkout flow.

---

## DynamoDB Record

```
PK: SUB#abc123
SK: SUBSCRIPTION
GSI2PK: SUB#STATUS
GSI2SK: active#abc123

chargebeeSubscriptionId: "AzqTl9VDwwg4k2qWl"
chargebeeCustomerId: "abc123"          ← same as householdId
status: "active"
planId: "TableTryb-USD-Monthly"
trialStartedAt: "2026-03-15T00:00:00Z"
trialEndsAt: "2026-03-29T00:00:00Z"
currentPeriodStart: "2026-03-29T00:00:00Z"
currentPeriodEnd: "2026-04-29T00:00:00Z"
updatedAt: "2026-03-29T00:00:00Z"
```

Note: `chargebeeCustomerId` = `householdId`. This is by design.

---

## Chargebee Webhook Events Handled

| Event | Action |
|-------|--------|
| `subscription_created` | Create DynamoDB subscription record |
| `subscription_activated` | Update status to `active` |
| `subscription_renewed` | Update `currentPeriodEnd` |
| `subscription_cancelled` | Set status to `cancelled`, add 90-day TTL |
| `subscription_reactivated` | Update status to `active`, remove TTL |
| `subscription_changed` | Update planId and status |
| `payment_succeeded` | Log for audit |
| `payment_failed` | Set status to `past_due` |
| `payment_refunded` | Log for audit |
| `subscription_trial_end_reminder` | Could trigger email notification (future) |

Webhook authentication: Chargebee sends Basic Auth with the webhook secret in the username field. Our Lambda verifies this against `CHARGEBEE_WEBHOOK_SECRET`.

---

## Chargebee Configuration (Test Site: tabletryb-test)

### Product Catalog 2.0 Setup
- **Plan:** "TableTryb" (item)
- **Price points:** `TableTryb-USD-Monthly` ($4.99/mo), `TableTryb-USD-Yearly` ($49.99/yr)
- **Trial:** 14 days on both price points
- **Custom field:** `cf_household_id` on subscriptions — set to optional, admin-only (not required for checkout; kept for dashboard visibility but not used for linking)

### Webhook Configuration
- **Endpoint:** `https://<api-url>/v1/webhooks/chargebee`
- **Auth:** Basic auth, secret in username field
- **Events:** subscription_created, subscription_activated, subscription_renewed, subscription_cancelled, subscription_reactivated, subscription_changed, subscription_trial_end_reminder, payment_succeeded, payment_failed, payment_refunded

### Dunning Configuration
- **Mode:** Custom
- **Retry schedule:** Days 1, 4, 8, then cancel subscription

### Portal Configuration
- **"Allow access to customer portal via API"** must be enabled (Settings → Checkout & Self-Serve Portal → Portal)

### Checkout Configuration
- **"Allow customers to access checkout via API only"** enabled
- Branded with TableTryb logo

---

## Who Can Manage Billing

Only the **account holder** (the user who created the household and has `isAccountHolder: true`) sees the "Manage Subscription / Billing" button on the Profile page. This prevents household members from accidentally cancelling the subscription.

The `isAccountHolder` flag lives only in DynamoDB (not in the JWT) since it's only checked for billing-related actions. Currently simplified: all primary users see the button. Full `isAccountHolder` check is a TODO.
SUBSCRIPTION_EOF

echo "   ✅ SUBSCRIPTION.md rewritten"

# ============================================================================
# API.md — Add portal endpoint, update subscription section
# ============================================================================
echo "→ Updating API.md..."

# Replace the Subscription section
sed -i '' '/## Subscription/,/## Image Upload/{
/## Image Upload/!{
/## Subscription/!d
}
}' "$DOCS_DIR/API.md"

# Now insert the new subscription section before "## Image Upload"
sed -i '' '/## Image Upload/i\
## Subscription\
\
| Method | Path | Lambda | Role | Description |\
|--------|------|--------|------|-------------|\
| POST | `/v1/subscription/checkout` | `subscription/create-checkout` | Primary | Generate Chargebee hosted checkout URL |\
| GET | `/v1/subscription/status` | `subscription/get-status` | Any authenticated | Current subscription status + trial days remaining |\
| POST | `/v1/subscription/portal` | `subscription/create-portal` | Primary | Generate Chargebee customer portal session URL |\
\
### Checkout Request Body\
\
```json\
{\
  "planId": "TableTryb-USD-Monthly",\
  "householdId": "abc123",\
  "redirectUrl": "https://staging.tabletryb.com/app"\
}\
```\
\
Returns `{ "checkoutUrl": "https://tabletryb-test.chargebee.com/..." }` — frontend redirects to this URL.\
\
### Status Response\
\
```json\
{\
  "status": "in_trial",\
  "planId": null,\
  "trialDaysRemaining": 12,\
  "trialEndsAt": "2026-03-29T00:00:00Z",\
  "currentPeriodEnd": null,\
  "cancelAtPeriodEnd": false,\
  "chargebeeCustomerId": null\
}\
```\
\
When no Chargebee subscription exists, trial is calculated from household `createdAt + 14 days`.\
\
### Portal Response\
\
```json\
{\
  "portalUrl": "https://tabletryb-test.chargebeeportal.com/portal/access/..."\
}\
```\
\
Frontend navigates to this URL in the same tab. Chargebee portal redirects back to `/app/profile` when done.\
' "$DOCS_DIR/API.md"

echo "   ✅ API.md updated"

# ============================================================================
# DATABASE.md — Add firstName/lastName to member record, update member cap
# ============================================================================
echo "→ Updating DATABASE.md..."

# Add firstName and lastName to member record
sed -i '' 's/| displayName | String |/| firstName | String |\
| lastName | String |\
| displayName | String (preferred name) |/' "$DOCS_DIR/DATABASE.md"

# Update maxMembers from 8 to 50
sed -i '' 's/| maxMembers | Number | `8` |/| maxMembers | Number | `50` |/' "$DOCS_DIR/DATABASE.md"

# Update chargebeeCustomerId description
sed -i '' 's/| chargebeeCustomerId | String |/| chargebeeCustomerId | String (= householdId) |/' "$DOCS_DIR/DATABASE.md"

echo "   ✅ DATABASE.md updated"

# ============================================================================
# ARCHITECTURE.md — Update Lambda count, add portal to subscription section
# ============================================================================
echo "→ Updating ARCHITECTURE.md..."

# Update Lambda count from 25 to 26
sed -i '' 's/25 Lambda functions/26 Lambda functions/g' "$DOCS_DIR/ARCHITECTURE.md"
sed -i '' 's/25 functions/26 functions/g' "$DOCS_DIR/ARCHITECTURE.md"

# Update subscription folder description
sed -i '' 's|subscription/           # Chargebee checkout, webhook, status|subscription/           # Chargebee checkout, webhook, status, portal|' "$DOCS_DIR/ARCHITECTURE.md"

echo "   ✅ ARCHITECTURE.md updated"

# ============================================================================
# DEPLOYMENT.md — Add export note, custom domain details
# ============================================================================
echo "→ Updating DEPLOYMENT.md..."

# Add export note after the .env setup section
sed -i '' '/Edit with production values/a\
\
**Important:** All variables in `.env.staging` and `.env.prod` must have the `export` prefix\
so they are available to CDK via `process.env`. Example:\
\
```bash\
export CHARGEBEE_API_KEY=test_DMk...\
```\
\
If you forget `export`, the deploy will succeed but Lambda environment variables will be empty.' "$DOCS_DIR/DEPLOYMENT.md"

echo "   ✅ DEPLOYMENT.md updated"

# ============================================================================
# INFRASTRUCTURE.md — Add portal Lambda to the list
# ============================================================================
echo "→ Updating INFRASTRUCTURE.md..."

# Add portal Lambda after webhook secret entry if not already there
if ! grep -q "create-portal" "$DOCS_DIR/INFRASTRUCTURE.md"; then
  sed -i '' '/CHARGEBEE_WEBHOOK_SECRET.*Webhook signature/a\
\
The `SubscriptionPortal` Lambda also receives `CHARGEBEE_SITE` and `CHARGEBEE_API_KEY`\
as explicit environment variables (same as checkout and webhook).' "$DOCS_DIR/INFRASTRUCTURE.md"
fi

echo "   ✅ INFRASTRUCTURE.md updated"

# ============================================================================
# ROLES-AND-PERMISSIONS.md — Update billing description
# ============================================================================
echo "→ Updating ROLES-AND-PERMISSIONS.md..."

# Update the billing action description
sed -i '' 's/Manage billing (Chargebee)/Manage Subscription \/ Billing (Chargebee portal)/' "$DOCS_DIR/ROLES-AND-PERMISSIONS.md"

echo "   ✅ ROLES-AND-PERMISSIONS.md updated"

# ============================================================================
# New file: COGNITO-ATTRIBUTES.md
# ============================================================================
echo "→ Creating COGNITO-ATTRIBUTES.md..."

cat > "$DOCS_DIR/COGNITO-ATTRIBUTES.md" << 'COGNITO_EOF'
# TableTryb — Cognito User Attributes

**Updated:** March 15, 2026

## Standard Attributes

| Cognito Attribute | US Label | AuthUser Field | Set At | Purpose |
|-------------------|----------|----------------|--------|---------|
| `email` | Email | `email` | Sign up | Login identifier, Chargebee customer email |
| `given_name` | First Name | `firstName` | Sign up | Legal first name — Chargebee invoices |
| `family_name` | Last Name | `lastName` | Sign up | Legal last name — Chargebee invoices |
| `name` | Preferred Name | `displayName` | Sign up | What the app shows (avatar, dropdown, member lists) |

If Preferred Name is left blank at signup, it defaults to First Name.

## Custom Attributes

| Cognito Attribute | AuthUser Field | Set By | Purpose |
|-------------------|----------------|--------|---------|
| `custom:householdId` | `householdId` | `household/create` or `household/accept-invite` Lambda | Links user to household |
| `custom:role` | `role` | `household/create` or `household/accept-invite` Lambda | `"primary"` or `"member"` |

Custom attributes are set **server-side** via `AdminUpdateUserAttributes`. After setting them, the frontend must call `refreshUser()` which uses `cognitoUser.refreshSession()` (not `getSession()`) to get a fresh ID token with the updated claims.

## Data Flow

```
Sign Up Form
  ├── First Name  → Cognito given_name  → JWT claim → AuthUser.firstName
  ├── Last Name   → Cognito family_name → JWT claim → AuthUser.lastName
  └── Pref. Name  → Cognito name        → JWT claim → AuthUser.displayName
         │
         ├── AppShell dropdown: shows displayName
         ├── ProfilePage: shows all three
         ├── Household member record (DynamoDB): stores all three
         ├── Chargebee: first_name + last_name for invoices
         └── Vote records: show displayName
```

## CDK Configuration

The Cognito User Pool is defined in `infrastructure/lib/tabletryb-stack.ts`:

```typescript
standardAttributes: {
  email: { required: true, mutable: true },
},
customAttributes: {
  householdId: new cognito.StringAttribute({ maxLen: 64, mutable: true }),
  role: new cognito.StringAttribute({ maxLen: 16, mutable: true }),
},
```

Note: `given_name`, `family_name`, and `name` are standard Cognito attributes that exist on every user pool. They don't need to be declared in `standardAttributes` — that block only controls which attributes are **required** at signup. Adding required attributes to an existing user pool requires replacing it, so we set them at signup time without making them required.

## Token Refresh Pattern

After server-side Cognito attribute updates (e.g., after household creation), the frontend **must** use `refreshSession()` with the refresh token — not `getSession()` which returns the cached JWT:

```typescript
// WRONG — returns cached token without new attributes
cognitoUser.getSession(...)

// RIGHT — exchanges refresh token for fresh ID token
const refreshToken = session.getRefreshToken();
cognitoUser.refreshSession(refreshToken, (err, newSession) => {
  // newSession has updated custom:householdId and custom:role
});
```

This is implemented in `AuthContext.refreshUser()`.
COGNITO_EOF

echo "   ✅ COGNITO-ATTRIBUTES.md created"

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "========================================="
echo "  Documentation updated successfully!"
echo "========================================="
echo ""
echo "Files modified:"
echo "  • docs/SUBSCRIPTION.md      — Rewritten (PC 2.0, customer[id] pattern, local trial)"
echo "  • docs/API.md               — Added portal endpoint, updated subscription section"
echo "  • docs/DATABASE.md          — Added firstName/lastName, updated member cap"
echo "  • docs/ARCHITECTURE.md      — Updated Lambda count to 26, added portal"
echo "  • docs/DEPLOYMENT.md        — Added export note for .env files"
echo "  • docs/INFRASTRUCTURE.md    — Added portal Lambda note"
echo "  • docs/ROLES-AND-PERMISSIONS.md — Updated billing label"
echo ""
echo "Files created:"
echo "  • docs/COGNITO-ATTRIBUTES.md — New: name fields, token refresh pattern"
echo ""
echo "Review changes with: git diff docs/"
echo "Commit with: git add docs/ && git commit -m 'docs: update for Chargebee PC 2.0, name fields, subscribe flow'"