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
