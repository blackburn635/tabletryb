# TableTryb — Subscription & Billing (Chargebee)

## Why Chargebee (Not Stripe Direct)

- **Subscription lifecycle** — trials, renewals, dunning (failed payment retries), cancellation flows handled automatically
- **Hosted checkout** — PCI-compliant payment pages without building payment forms
- **Customer portal** — users manage their own billing (update card, view invoices, cancel)
- **Webhook-driven** — all state changes pushed to our Lambda, DynamoDB is source of truth for access control

---

## Plan Structure

| | Free Trial | TableTryb Plan |
|--|-----------|----------------|
| Duration | 14 days | Monthly or Annual |
| Monthly price | $0 | $4.99/mo |
| Annual price | $0 | $49.99/yr (save ~17%) |
| Household members | Up to 8 | Up to 8 |
| Recipes | Unlimited | Unlimited |
| Claude AI scans | 10 during trial | Unlimited |
| Grocery stores | 1 store | Up to 3 stores |
| Cart push | ❌ | ✅ |

---

## Subscription Flow

### 1. User Creates Household → Chargebee Checkout

```
Frontend: POST /v1/subscription/checkout
  → { planId: "tabletryb-monthly", householdId: "abc123", redirectUrl: "/app" }

Lambda: Creates Chargebee hosted checkout session with 14-day trial
  → Returns checkoutUrl

Frontend: Redirects to Chargebee checkout page
  → User enters payment details (card on file for post-trial)
  → Chargebee redirects back to our app

Chargebee Webhook: subscription_created (status=in_trial)
  → Lambda writes SUB#abc123 to DynamoDB with status="in_trial"
```

### 2. Trial Ends → Active

```
Chargebee: Auto-charges card on file
Webhook: subscription_activated
  → Lambda updates DynamoDB status to "active"
```

### 3. Payment Fails

```
Chargebee: Retries per dunning configuration (3 attempts over 7 days)
Webhook: payment_failed
  → Lambda updates status to "past_due"
  → App shows warning banner: "Update your payment method"
```

### 4. User Cancels

```
User: Opens Chargebee customer portal from Profile page
  → Clicks cancel subscription

Webhook: subscription_cancelled
  → Lambda sets status to "cancelled"
  → Sets TTL (90 days) for data retention
  → App becomes read-only (can view/export but not create or vote)
```

### 5. Billing Portal

```
Frontend: POST /v1/subscription/portal
  → Lambda generates Chargebee portal session URL
  → Frontend opens in new tab
  → User manages billing directly in Chargebee
```

---

## Access Control by Status

| Status | App Behavior |
|--------|-------------|
| `in_trial` | Full access + trial banner showing days remaining |
| `active` | Full access |
| `past_due` | Full access + payment warning banner |
| `cancelled` | Read-only (view recipes, export grocery lists, no new imports/votes) |
| `expired` | Locked out, redirect to resubscribe page |
| `none` | No subscription yet, redirect to onboarding |

The frontend checks subscription status from `GET /v1/subscription/status`. The backend can also check before allowing writes.

---

## DynamoDB Record

```
PK: SUB#abc123
SK: SUBSCRIPTION
GSI2PK: SUB#STATUS
GSI2SK: active#abc123

chargebeeSubscriptionId: "sub_xyz"
chargebeeCustomerId: "cust_xyz"
status: "active"
planId: "tabletryb-monthly"
trialStartedAt: "2026-03-10T00:00:00Z"
trialEndsAt: "2026-03-24T00:00:00Z"
currentPeriodStart: "2026-03-24T00:00:00Z"
currentPeriodEnd: "2026-04-24T00:00:00Z"
updatedAt: "2026-03-24T00:00:00Z"
```

---

## Chargebee Webhook Events Handled

| Event | Action |
|-------|--------|
| `subscription_created` | Create DynamoDB subscription record |
| `subscription_activated` | Update status to `active` |
| `subscription_renewed` | Update `currentPeriodEnd` |
| `subscription_cancelled` | Set status to `cancelled`, add 90-day TTL |
| `subscription_reactivated` | Update status to `active`, remove TTL |
| `payment_succeeded` | Log for audit |
| `payment_failed` | Set status to `past_due` |
| `payment_refunded` | Log for audit |
| `subscription_trial_end_reminder` | Could trigger email notification (future) |

Webhook authentication: Chargebee sends Basic Auth with the webhook password. Our Lambda verifies this against `CHARGEBEE_WEBHOOK_SECRET`.

---

## Chargebee Setup Checklist

1. Create Chargebee account (test site + live site)
2. Create plan: `tabletryb-monthly` ($4.99/mo, 14-day trial)
3. Create plan: `tabletryb-annual` ($49.99/yr, 14-day trial)
4. Add custom field on subscription: `cf_household_id` (String)
5. Configure webhook endpoint: `https://{api-url}/v1/webhooks/chargebee`
6. Set webhook password (store as `CHARGEBEE_WEBHOOK_SECRET`)
7. Configure dunning (retry schedule for failed payments)
8. Customize hosted checkout page styling to match TableTryb branding

---

## Who Can Manage Billing

Only the **account holder** (the user who created the household and has `isAccountHolder: true`) sees the "Manage Billing" button on the Profile page. This prevents household members from accidentally cancelling the subscription.
