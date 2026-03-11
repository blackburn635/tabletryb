# TableTryb — Architecture Overview

**Version:** 1.1 · **Updated:** March 10, 2026
**Origin:** Family Meal Planner personal prototype (AWS account 422207057006)
**Target:** Dedicated AWS account (Cloudscribble business, account 528757783633)
**Company:** Cloudscribble LLC

---

## What TableTryb Is

TableTryb is a commercial SaaS platform where families collaboratively plan meals. Users import recipes from any source (photo scan, URL, manual entry) using Claude AI, vote on weekly meals as a household, and generate smart grocery lists with store integrations.

**Tagline:** "Feed your tribe."

## Origin — What We Kept From the Prototype

The Family Meal Planner prototype proved out the core product on a single-family serverless stack. These features carry forward unchanged in concept:

- **Claude AI recipe extraction** — photo scan + URL import. This is the killer feature. The extraction prompt, two-step review flow (extract → review → save), and HEIC/PDF handling all carry forward.
- **Family voting + finalization workflow** — thumbs up/down per member, primary users finalize selections.
- **Smart grocery list** — consolidated from finalized meals, grouped by store aisle, pantry staples separated.
- **Serverless architecture** — Lambda + DynamoDB + API Gateway. Scales to zero, scales to millions.
- **Single-table DynamoDB design** — proven pattern, handles all access patterns.
- **ARM64 Graviton Lambdas** — 20% cheaper, no code changes.

## What Changed for Commercial

| Aspect | Prototype | Commercial |
|--------|-----------|------------|
| Infrastructure as Code | SAM (YAML) | **CDK (TypeScript)** — consistent with Cloudscribble |
| Runtime | Python 3.12 | **Node.js 20 (TypeScript)** — shared types across frontend/backend/infra |
| Frontend hosting | S3 static website (HTTP) | **Amplify Hosting** — CloudFront CDN, HTTPS, custom domain, PR previews |
| Auth | Cognito (admin-created users) | **Cognito (self-signup)** — users create accounts, invite household members |
| Multi-tenancy | Single family, hardcoded members | **Household model** — `HH#<id>` partition prefix, invitation system |
| Billing | Free | **Chargebee** — 14-day trial → paid subscription |
| Recipe discovery | Spoonacular API (random recipes) | **Removed** — users build their own library via import |
| Environments | Single (prod) | **Staging + Production** — isolated CloudFormation stacks |
| Grocery stores | H-E-B search links only | **Tiered model** — cart push (Kroger), search links (H-E-B, Walmart, etc.), list export |
| Roles | Parent / Child | **Primary / Member** with account holder flag |
| Region | us-east-2 (Ohio) | **us-east-2** — Amplify feature completeness, service availability |

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          INTERNET                                   │
└──────────────┬──────────────────────────────┬───────────────────────┘
               │                              │
    ┌──────────▼──────────┐       ┌───────────▼────────────┐
    │   Amplify Hosting   │       │   Chargebee (SaaS)     │
    │   (CloudFront CDN)  │       │   - Checkout pages     │
    │   React SPA         │       │   - Customer portal    │
    │   Custom domain     │       │   - Webhook events     │
    └──────────┬──────────┘       └───────────┬────────────┘
               │                              │
    ┌──────────▼──────────────────────────────▼────────────┐
    │              API Gateway (HTTP API v2)                 │
    │              JWT Authorizer (Cognito)                  │
    │              Proxy integration (Lambda)                │
    │              CORS: dynamic origin reflection           │
    └──────────┬──────────────────────────────┬────────────┘
               │                              │
    ┌──────────▼──────────┐       ┌───────────▼────────────┐
    │   Cognito User Pool │       │   Lambda Functions     │
    │   - Self-signup     │       │   (Node 20, ARM64)     │
    │   - Email verify    │       │   25 functions         │
    │   - Custom attrs:   │       │   TypeScript + esbuild │
    │     householdId     │       └───────────┬────────────┘
    │     role            │                   │
    └─────────────────────┘    ┌──────────────┼──────────────┐
                               │              │              │
                    ┌──────────▼──┐  ┌────────▼────┐  ┌─────▼───────┐
                    │  DynamoDB   │  │  S3 Bucket  │  │  External   │
                    │  (On-Demand)│  │  Recipe     │  │  APIs       │
                    │  Single     │  │  images     │  │  - Claude   │
                    │  table      │  └─────────────┘  │  - Kroger   │
                    │  Multi-     │                    │  - SES      │
                    │  tenant     │                    └─────────────┘
                    └─────────────┘
```

## Monorepo Structure

```
tabletryb/
├── package.json                    # Root npm workspaces config
├── tsconfig.base.json              # Shared TypeScript config
├── amplify.yml                     # Amplify Hosting build spec
├── deploy.sh                       # CDK deploy wrapper (staging/prod)
├── cdk.json                        # CDK app config
├── .github/workflows/
│   ├── ci.yml                      # Lint + typecheck on PR
│   ├── deploy-staging.yml          # develop branch → staging
│   └── deploy-prod.yml             # main branch → production
│
├── packages/shared/                # @tabletryb/shared — types, constants, utils
│   └── src/
│       ├── types/                  # Recipe, Household, MealPlan, Grocery, Subscription
│       ├── constants/              # Branding, aisles, pantry staples
│       └── utils/                  # Week calculations, ingredient normalization
│
├── frontend/                       # @tabletryb/frontend — React SPA
│   └── src/
│       ├── config/                 # Amplify, branding, chargebee, themes
│       ├── context/                # Auth, Theme
│       ├── hooks/                  # useApi
│       ├── pages/                  # Public, onboarding, app, accept-invite
│       ├── components/             # Layout, common, recipe, meal-plan, grocery
│       └── styles/                 # Global CSS with custom properties
│
├── backend/                        # @tabletryb/backend — Lambda functions
│   └── functions/
│       ├── _shared/                # DynamoDB client, auth, response, errors
│       ├── contact/                # Contact form (public)
│       ├── household/              # CRUD, invite, accept, remove
│       ├── recipes/                # CRUD + Claude AI analyze
│       ├── meal-plan/              # Generate, vote, finalize
│       ├── grocery/                # Generate list, cart push
│       ├── subscription/           # Chargebee checkout, webhook, status
│       ├── image-upload/           # S3 presigned URLs
│       └── stores/                 # List supported stores
│
├── infrastructure/                 # @tabletryb/infrastructure — CDK
│   ├── bin/app.ts                  # Entry point (staging + prod stacks)
│   ├── lib/tabletryb-stack.ts      # Main stack (all resources)
│   └── lib/constructs/
│       └── tryb-function.ts        # Reusable Lambda construct
│
└── docs/                           # Documentation
    ├── ARCHITECTURE.md             # This file
    ├── DATABASE.md                 # DynamoDB schema
    ├── API.md                      # API endpoints
    ├── INFRASTRUCTURE.md           # CDK stack details
    ├── DEPLOYMENT.md               # How to deploy
    ├── CORS.md                     # CORS configuration
    ├── ROLES-AND-PERMISSIONS.md    # User roles
    ├── GROCERY-STORES.md           # Store integration tiers
    └── BRANDING-GUIDE.md           # Logos, colors, fonts
```

## Key Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| IaC | **CDK (TypeScript)** | Consistent with Cloudscribble, type-safe, reusable constructs, 40% less code than SAM |
| Database | **DynamoDB (single-table, on-demand)** | Proven in prototype, scales to zero, no connection pooling, cheapest for key-value access |
| Auth | **Cognito** | Native AWS, free tier (50K MAU), JWT integration with API Gateway |
| Billing | **Chargebee** | Subscription lifecycle, hosted checkout (PCI compliant), customer portal, webhooks |
| Frontend | **React SPA + Amplify Hosting** | Fast deploys, built-in CDN, PR previews, branch-based environments |
| Backend runtime | **Node.js 20 (TypeScript)** | Shared types with frontend, better cold starts than Python, one language everywhere |
| Backend architecture | **Lambda (ARM64) + HTTP API** | 20% cheaper on Graviton, HTTP API is 70% cheaper than REST API |
| Monorepo | **npm workspaces** | Simple, no extra tooling overhead |
| API style | **REST via HTTP API v2 (proxy integration)** | Lambda controls full response including CORS headers |
| Environments | **Staging + Production in same AWS account** | Isolated CloudFormation stacks from same CDK code |

## Cost Estimates

### 0–100 households (~$7–17/mo)
DynamoDB, Lambda, API Gateway, Cognito, Amplify all within free tier. Main costs are Claude AI (~$5–15 for recipe extractions) and minimal S3/SES usage.

### 1,000 households (~$380–510/mo)
Revenue at $5.99/mo × 1,000 = $5,990/mo. Infrastructure ~$450/mo. **~92% gross margin.**

---

*Maintained alongside the codebase. Update when architectural decisions change.*
