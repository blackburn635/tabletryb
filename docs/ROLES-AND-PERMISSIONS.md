# TableTryb — Roles & Permissions

## Role Model

TableTryb has two user roles and an account holder flag:

### Account Holder
- The user who signs up and creates the household
- Always a primary user (cannot be demoted)
- Only the account holder can manage Chargebee billing (update payment, cancel subscription)
- Stored as `isAccountHolder: true` on their DynamoDB membership record
- There is exactly one account holder per household

### Primary User
- Can do everything a member can do, plus:
  - Finalize vote results (select meals for grocery list)
  - View and manage the grocery list
  - Invite and remove household members
  - Designate other members as primary users
  - Configure household settings (stores, meal count, reset schedule)
- Multiple users can be primary
- The account holder is always primary

### Member
- Can view the recipe list
- Can add recipes (photo, URL, manual)
- Can vote on weekly selections (thumbs up/down)
- Can see how others voted
- Cannot finalize selections, view grocery list, manage users, or change settings

---

## Permission Matrix

| Action | Account Holder | Primary | Member |
|--------|:-:|:-:|:-:|
| View selections / vote | ✅ | ✅ | ✅ |
| See how others voted | ✅ | ✅ | ✅ |
| View recipe list | ✅ | ✅ | ✅ |
| Add recipes (photo/URL/manual) | ✅ | ✅ | ✅ |
| Edit recipes | ✅ | ✅ | ✅ |
| Delete recipes | ✅ | ✅ | ❌ |
| View vote results (Tab 2) | ✅ | ✅ | ❌ |
| Finalize meal selections | ✅ | ✅ | ❌ |
| View grocery list (Tab 3) | ✅ | ✅ | ❌ |
| Push to grocery cart | ✅ | ✅ | ❌ |
| Invite members | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | ❌ |
| Designate primary users | ✅ | ✅ | ❌ |
| Change settings | ✅ | ✅ | ❌ |
| Manage billing (Chargebee) | ✅ | ❌ | ❌ |

---

## How Roles Are Stored

### Cognito Custom Attributes
```
custom:householdId  →  "abc123def456"
custom:role         →  "primary" or "member"
```

These are set when a user creates a household or accepts an invite, and included in the JWT token. Every Lambda can read them from the JWT claims without a database lookup.

### DynamoDB Membership Record
```
PK: HH#abc123def456
SK: MEMBER#cognito-sub-uuid
role: "primary"
isAccountHolder: true
```

The `isAccountHolder` flag lives only in DynamoDB (not in the JWT) since it's only checked for billing-related actions.

---

## Enforcement

### Backend (Lambda)
```typescript
// backend/functions/_shared/auth.ts

requireHouseholdAccess(user, householdId)   // Verifies user belongs to this household
requirePrimary(user)                         // Verifies user.role === 'primary'
requireHouseholdPrimary(user, householdId)   // Both checks combined
```

Every Lambda that modifies household-level data calls `requireHouseholdPrimary()`. Read-only endpoints call `requireHouseholdAccess()`.

### Frontend (React)
```typescript
// Check role from auth context
const { user } = useAuth();
const isPrimary = user?.role === 'primary';

// Tabs 2 and 3 are conditionally rendered
const visibleTabs = tabs.filter(t => !t.primaryOnly || isPrimary);

// Dropdown menu items are conditionally shown
{isPrimary && <button onClick={() => navigate('/app/users')}>Users</button>}
{isPrimary && <button onClick={() => navigate('/app/settings')}>Settings</button>}
```

Frontend checks are for UX only — the backend enforces permissions regardless.

---

## User Lifecycle

```
1. User signs up via Cognito (email/password)
   → role: null, householdId: null

2a. User creates a household
   → role: "primary", isAccountHolder: true
   → Cognito custom:role = "primary", custom:householdId = "<id>"

2b. User accepts an invitation
   → role: whatever the inviter specified ("primary" or "member")
   → isAccountHolder: false
   → Cognito attributes set accordingly

3. Primary user can promote a member to primary
   → Update DynamoDB role + Cognito custom:role

4. Primary user can remove a member
   → Delete DynamoDB membership record + clear Cognito attributes
   → Cannot remove the account holder
```
