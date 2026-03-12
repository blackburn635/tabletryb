# TableTryb — Deployment Guide

## Overview

TableTryb uses a two-part deployment:
1. **Backend** — CDK deploys Lambda, DynamoDB, Cognito, API Gateway, S3 to AWS
2. **Frontend** — Amplify Hosting builds the React SPA and serves via CloudFront

Both are automated via GitHub Actions, triggered by branch pushes.

---

## Environments

| Environment | Git Branch | Backend Stack | Frontend URL | Purpose |
|-------------|-----------|---------------|-------------|---------|
| Local dev | any | Uses staging backend | `localhost:3000` | Active development |
| Staging | `develop` | `TableTryb-staging` | `staging.tabletryb.com` | Testing before production |
| Production | `main` | `TableTryb-prod` | `tabletryb.com` | Live customers |

---

## Prerequisites

1. **AWS CLI v2** configured with credentials for the TableTryb AWS account
2. **Node.js 20+**
3. **AWS CDK CLI**: `npm install -g aws-cdk`
4. **GitHub repo** connected to Amplify Hosting

---

## First-Time Setup

### 1. Bootstrap CDK (once per account/region)

```bash
cdk bootstrap aws://891920435168/us-east-2
```

### 2. Set Environment Variables

Create `.env.staging` and `.env.prod` from `.env.example`:

```bash
cp .env.example .env.staging
# Edit with staging values (Chargebee test site, etc.)

cp .env.example .env.prod
# Edit with production values
```

### 3. Deploy Staging Backend

```bash
source .env.staging
./deploy.sh staging
```

Note the stack outputs — you'll need `ApiUrl`, `UserPoolId`, and `UserPoolClientId`.

### 4. Configure Amplify Hosting

In the AWS Amplify Console:
1. Connect your GitHub repository
2. Add two branches: `develop` (staging) and `main` (production)
3. Set environment variables per branch:

**develop branch:**
```
REACT_APP_API_URL = https://4f5t6dgga2.execute-api.us-east-2.amazonaws.com
REACT_APP_USER_POOL_ID = us-east-2_BCN0r9Ilj
REACT_APP_USER_POOL_CLIENT_ID = 1vu6t16aurrqun3n965ch0ojhd
REACT_APP_CHARGEBEE_SITE = tabletryb-test
```

**main branch:**
```
REACT_APP_API_URL = https://{prod-api-id}.execute-api.us-east-2.amazonaws.com
REACT_APP_USER_POOL_ID = {prod pool id}
REACT_APP_USER_POOL_CLIENT_ID = {prod client id}
REACT_APP_CHARGEBEE_SITE = tabletryb
```

### 5. Configure Custom Domains in Amplify

- `develop` branch → `staging.tabletryb.com`
- `main` branch → `tabletryb.com` + `www.tabletryb.com`

Amplify provisions ACM certificates automatically.

### 6. Set GitHub Secrets

Repository → Settings → Secrets and variables → Actions → Environments:

**staging environment:**
| Secret | Value |
|--------|-------|
| `AWS_DEPLOY_ROLE_ARN` | IAM role ARN for GitHub OIDC |
| `ANTHROPIC_API_KEY` | Claude API key |
| `CHARGEBEE_SITE` | `tabletryb-test` |
| `CHARGEBEE_API_KEY` | Test site API key |
| `CHARGEBEE_WEBHOOK_SECRET` | Test webhook secret |

**production environment:**
| Secret | Value |
|--------|-------|
| `AWS_DEPLOY_ROLE_ARN` | Same IAM role (or production-specific) |
| `ANTHROPIC_API_KEY` | Claude API key (can be same or separate) |
| `CHARGEBEE_SITE` | `tabletryb` |
| `CHARGEBEE_API_KEY` | Live site API key |
| `CHARGEBEE_WEBHOOK_SECRET` | Live webhook secret |

---

## Day-to-Day Workflow

```
1. Write code locally
   - npm run dev (React on localhost:3000, talks to staging AWS backend)

2. Push to develop
   - GitHub Actions: cdk deploy TableTryb-staging
   - Amplify: builds frontend → staging.tabletryb.com

3. Test staging
   - Verify at staging.tabletryb.com with staging Cognito users

4. Merge develop → main (PR or direct merge)
   - GitHub Actions: cdk deploy TableTryb-prod
   - Amplify: builds frontend → tabletryb.com

5. Production is live
```

---

## Manual Deployment

If you need to deploy outside of CI/CD:

```bash
# Staging
source .env.staging
./deploy.sh staging

# Production
source .env.prod
./deploy.sh prod
```

## Preview Changes Without Deploying

```bash
# See what CloudFormation changes would be applied
npm run diff:staging
npm run diff:prod

# Generate CloudFormation template without deploying
npm run synth
```

## Teardown

```bash
# Staging (safe — all resources set to DESTROY)
cd infrastructure && npx cdk destroy TableTryb-staging

# Production — DO NOT destroy casually
# DynamoDB, Cognito, and S3 have RETAIN policies
# They'll survive stack deletion and need manual cleanup
```

---

## Troubleshooting

**CDK deploy fails with "resource already exists"**
The resource was created outside of CDK. Import it: `cdk import TableTryb-{stage}`

**Amplify build fails**
Check that `npm run build:shared` runs before `npm run build:frontend`. This is configured in `amplify.yml`.

**CORS errors after deployment**
Verify the CORS origins match between API Gateway (CDK stack) and Lambda response headers (response.ts). See `docs/CORS.md` for the full CORS architecture.
