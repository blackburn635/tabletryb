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
