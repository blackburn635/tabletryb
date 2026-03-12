#!/bin/bash
# update-docs.sh — Update TableTryb documentation after initial staging deployment
#
# Changes reflected:
#   1. AWS account: 891920435168 (dedicated, under Cloudscribble AWS Organizations)
#   2. Region: us-east-2 (Ohio) — changed from us-east-1
#   3. Staging stack deployed with real outputs
#   4. Amplify Hosting connected (develop branch)
#   5. Brand colors finalized (mustard/lime/mauve/blue/pink)
#   6. Bug fixes applied during deployment
#
# Usage: ./update-docs.sh /path/to/tabletryb/docs
#
# This script is idempotent — safe to run multiple times.

set -euo pipefail

DOCS_DIR="${1:-.}"

if [ ! -d "$DOCS_DIR" ]; then
  echo "Error: Directory $DOCS_DIR does not exist"
  echo "Usage: ./update-docs.sh /path/to/tabletryb/docs"
  exit 1
fi

echo "========================================="
echo "  Updating TableTryb Documentation"
echo "  Directory: $DOCS_DIR"
echo "========================================="
echo ""

# ============================================================================
# ARCHITECTURE.md
# ============================================================================
ARCH="$DOCS_DIR/ARCHITECTURE.md"
if [ -f "$ARCH" ]; then
  echo "→ Updating ARCHITECTURE.md..."

  # Update version and date
  sed -i '' 's/\*\*Version:\*\* 1\.1 · \*\*Updated:\*\* March 10, 2026/**Version:** 1.2 · **Updated:** March 12, 2026/' "$ARCH"

  # Update target account
  sed -i '' 's/\*\*Target:\*\* Dedicated AWS account (Cloudscribble business, account 528757783633)/**Target:** Dedicated AWS account 891920435168 (member account under Cloudscribble AWS Organizations)/' "$ARCH"

  # Update region in comparison table
  sed -i '' 's/\*\*us-east-1\*\* — Amplify feature completeness, service availability/**us-east-2 (Ohio)** — fewer outages, all required services available/' "$ARCH"

  # Update any remaining us-east-1 references
  sed -i '' 's/us-east-1/us-east-2/g' "$ARCH"

  echo "  ✅ ARCHITECTURE.md updated"
else
  echo "  ⚠️  ARCHITECTURE.md not found, skipping"
fi

# ============================================================================
# DEPLOYMENT.md
# ============================================================================
DEPLOY="$DOCS_DIR/DEPLOYMENT.md"
if [ -f "$DEPLOY" ]; then
  echo "→ Updating DEPLOYMENT.md..."

  # Update all us-east-1 → us-east-2
  sed -i '' 's/us-east-1/us-east-2/g' "$DEPLOY"

  # Update bootstrap command with real account ID
  sed -i '' 's/cdk bootstrap aws:\/\/{ACCOUNT_ID}\/us-east-2/cdk bootstrap aws:\/\/891920435168\/us-east-2/' "$DEPLOY"

  # Update Amplify env var examples with real staging values
  sed -i '' 's/REACT_APP_API_URL = https:\/\/{staging-api-id}\.execute-api\.us-east-2\.amazonaws\.com/REACT_APP_API_URL = https:\/\/4f5t6dgga2.execute-api.us-east-2.amazonaws.com/' "$DEPLOY"
  sed -i '' 's/REACT_APP_USER_POOL_ID = {staging pool id}/REACT_APP_USER_POOL_ID = us-east-2_BCN0r9Ilj/' "$DEPLOY"
  sed -i '' 's/REACT_APP_USER_POOL_CLIENT_ID = {staging client id}/REACT_APP_USER_POOL_CLIENT_ID = 1vu6t16aurrqun3n965ch0ojhd/' "$DEPLOY"

  echo "  ✅ DEPLOYMENT.md updated"
else
  echo "  ⚠️  DEPLOYMENT.md not found, skipping"
fi

# ============================================================================
# INFRASTRUCTURE.md
# ============================================================================
INFRA="$DOCS_DIR/INFRASTRUCTURE.md"
if [ -f "$INFRA" ]; then
  echo "→ Updating INFRASTRUCTURE.md..."

  # Update all us-east-1 → us-east-2
  sed -i '' 's/us-east-1/us-east-2/g' "$INFRA"

  echo "  ✅ INFRASTRUCTURE.md updated"
else
  echo "  ⚠️  INFRASTRUCTURE.md not found, skipping"
fi

# ============================================================================
# API.md
# ============================================================================
API="$DOCS_DIR/API.md"
if [ -f "$API" ]; then
  echo "→ Updating API.md..."

  # Update region in base URL
  sed -i '' 's/us-east-1/us-east-2/g' "$API"

  echo "  ✅ API.md updated"
else
  echo "  ⚠️  API.md not found, skipping"
fi

# ============================================================================
# CORS.md — no region-specific content, but check just in case
# ============================================================================
CORS="$DOCS_DIR/CORS.md"
if [ -f "$CORS" ]; then
  echo "→ Checking CORS.md..."
  if grep -q 'us-east-1' "$CORS"; then
    sed -i '' 's/us-east-1/us-east-2/g' "$CORS"
    echo "  ✅ CORS.md updated"
  else
    echo "  ✅ CORS.md — no changes needed"
  fi
fi

# ============================================================================
# BRANDING-GUIDE.md — update color palette with actual values
# ============================================================================
BRAND="$DOCS_DIR/BRANDING-GUIDE.md"
if [ -f "$BRAND" ]; then
  echo "→ Updating BRANDING-GUIDE.md..."

  # Add a "Current Palette" section after the format section
  # Check if already added (idempotent)
  if ! grep -q 'Current Brand Palette' "$BRAND"; then
    cat >> "$BRAND" << 'PALETTE_EOF'

---

## 6. Current Brand Palette (Finalized March 12, 2026)

```
PRIMARY:          #dfa159   (Mustard — main brand color)
PRIMARY_LIGHT:    #efc088   (Light mustard)
PRIMARY_DARK:     #c4863d   (Dark mustard — button hover)
SECONDARY:        #8eb66b   (Lime green — secondary brand)
SECONDARY_LIGHT:  #b0cf96   (Light lime)
ACCENT:           #102984   (Deep blue — headings, special UI)
BACKGROUND:       #ffffff   (White)
BACKGROUND_ALT:   #f9f7f4   (Warm off-white)
SURFACE:          #ffffff   (Card backgrounds)
TEXT:             #1B1B1B   (Primary text)
TEXT_MUTED:       #6B7280   (Secondary text)
TEXT_INVERSE:     #ffffff   (Text on colored backgrounds)
BORDER:           #E5E7EB   (Subtle borders)
NAV_GLASS:        rgba(255, 255, 255, 0.92)
SUCCESS:          #8eb66b   (Lime green — brand)
WARNING:          #dfa159   (Mustard — brand)
ERROR:            #ba626c   (Mauve)
```

**Additional brand colors (available for future UI elements):**
- Accent Pink: `#f795ad` — notification badges, vote highlights, playful elements

**Files updated:**
- `packages/shared/src/constants/branding.ts` — source of truth
- `frontend/src/config/themes.ts` — `TABLETRYB_DEFAULT` palette (was `KITCHEN_WARM`)
- `frontend/src/styles/global.css` — `:root` CSS custom properties
- `frontend/public/index.html` — `theme-color` meta tag

**Logo assets in place:**
- `frontend/public/assets/logo-light.svg`
- `frontend/public/assets/logo-dark.svg`
- `frontend/public/assets/logo-icon.svg`
- `frontend/src/components/common/Logo.tsx` — updated to render `<img>` from asset files
PALETTE_EOF
    echo "  ✅ BRANDING-GUIDE.md updated with current palette"
  else
    echo "  ✅ BRANDING-GUIDE.md — palette section already present"
  fi
fi

# ============================================================================
# Create new doc: STAGING-OUTPUTS.md — quick reference for deployed resources
# ============================================================================
STAGING_OUT="$DOCS_DIR/STAGING-OUTPUTS.md"
echo "→ Creating STAGING-OUTPUTS.md..."
cat > "$STAGING_OUT" << 'STAGING_EOF'
# TableTryb — Staging Environment Outputs

**Deployed:** March 11, 2026
**Stack:** `TableTryb-staging`
**Account:** 891920435168 (TableTryb — member account under Cloudscribble AWS Organizations)
**Region:** us-east-2 (Ohio)
**Management Account:** 528757783633 (Cloudscribble LLC)

---

## Stack Outputs

| Resource | Value |
|----------|-------|
| **API URL** | `https://4f5t6dgga2.execute-api.us-east-2.amazonaws.com` |
| **User Pool ID** | `us-east-2_BCN0r9Ilj` |
| **User Pool Client ID** | `1vu6t16aurrqun3n965ch0ojhd` |
| **DynamoDB Table** | `tabletryb-staging` |
| **S3 Bucket** | `tabletryb-images-891920435168-staging` |
| **Region** | `us-east-2` |
| **Stack ARN** | `arn:aws:cloudformation:us-east-2:891920435168:stack/TableTryb-staging/7b8bea70-1ced-11f1-89a7-02d248157b35` |

---

## AWS Account Structure

```
Cloudscribble LLC (AWS Organizations)
├── 528757783633 — Cloudscribble (management account)
│   └── Cloudscribble website, other projects
└── 891920435168 — TableTryb (member account)
    ├── TableTryb-staging stack (deployed)
    └── TableTryb-prod stack (not yet deployed)
```

**CLI access:** Uses role assumption from Cloudscribble account.
```ini
# ~/.aws/config
[profile tabletryb]
role_arn = arn:aws:iam::891920435168:role/OrganizationAccountAccessRole
source_profile = default
region = us-east-2
```

---

## Frontend Environment Variables

### Local development (`frontend/.env.local`)
```
REACT_APP_API_URL=https://4f5t6dgga2.execute-api.us-east-2.amazonaws.com
REACT_APP_USER_POOL_ID=us-east-2_BCN0r9Ilj
REACT_APP_USER_POOL_CLIENT_ID=1vu6t16aurrqun3n965ch0ojhd
REACT_APP_CHARGEBEE_SITE=tabletryb-test
REACT_APP_REGION=us-east-2
```

### Amplify Console (develop branch)
Same values as above, set in the Amplify Console environment variables.

---

## Smoke Test Results

- ✅ API Gateway routing works (`/v1/contact` returns structured validation errors)
- ✅ Lambda functions execute and return proper JSON
- ✅ CORS headers present on responses
- ⏳ SES not configured (contact form returns INTERNAL_ERROR on send — expected)
- ⏳ Chargebee test site not configured
- ⏳ Anthropic API key not set (recipe analysis won't work yet)
- ⏳ Custom domain not configured (staging.tabletryb.com)

---

## Production Outputs

*Not yet deployed. Will be populated after `cdk deploy TableTryb-prod`.*

---

*Generated March 12, 2026. Update after each deployment.*
STAGING_EOF
echo "  ✅ STAGING-OUTPUTS.md created"

# ============================================================================
# Create new doc: CHANGELOG.md — track deployment progress
# ============================================================================
CHANGELOG="$DOCS_DIR/CHANGELOG.md"
if [ ! -f "$CHANGELOG" ]; then
  echo "→ Creating CHANGELOG.md..."
  cat > "$CHANGELOG" << 'CHANGELOG_EOF'
# TableTryb — Changelog

## March 12, 2026 — Initial Staging Deployment

### Infrastructure
- Created dedicated AWS account `891920435168` under Cloudscribble AWS Organizations
- Chose `us-east-2` (Ohio) region for all resources
- Bootstrapped CDK in the new account
- Deployed `TableTryb-staging` stack — all 25 Lambda functions, DynamoDB, Cognito, S3, API Gateway, CloudWatch alarms
- Connected GitHub repo to AWS Amplify Hosting (develop branch)
- First successful Amplify build and deployment

### Bug Fixes During Deployment
- **TrybFunction path resolution**: `tryb-function.ts` had incorrect relative path (`../../backend`) — needed `../../../backend` to resolve from `infrastructure/lib/constructs/` to repo root
- **Duplicate CfnOutput name**: `RecipeImageBucket` conflicted with the S3 bucket construct — renamed output to `RecipeImageBucketName`
- **Missing package-lock.json**: Wasn't committed to git — Amplify's `npm ci` requires it
- **npm cache corruption**: Root-owned files in `~/.npm` from prior `sudo npm install` — fixed with `sudo chown -R $(whoami) ~/.npm`
- **SES SendEmailCommand structure**: `ReplyToAddresses` was nested inside `Message` — moved to top-level sibling of `Source`/`Destination`/`Message`
- **TypeScript strict mode**: `response.json()` returns `unknown` — added `ClaudeResponse` interface and `ChargebeeCheckoutResponse` interface with `as` assertions
- **Missing composite flag**: `packages/shared/tsconfig.json` needed `"composite": true` for backend project references

### Branding
- Finalized brand color palette: Mustard (#dfa159), Lime Green (#8eb66b), Mauve (#ba626c), Deep Blue (#102984), Pink (#f795ad)
- Updated `branding.ts`, `themes.ts`, `global.css`, `index.html` with new colors
- Renamed default theme from `kitchen-warm` to `tabletryb-default`
- Placed logo SVGs in `frontend/public/assets/`
- Updated `Logo.tsx` from placeholder icon to `<img>` rendering actual logo files

### Not Yet Done
- [ ] SES domain verification (contact form, invitations)
- [ ] Chargebee test site configuration
- [ ] Custom domain setup (staging.tabletryb.com)
- [ ] Anthropic API key configuration
- [ ] Kroger API credentials
- [ ] GitHub Actions OIDC role for CI/CD deployments
- [ ] Port Lambda business logic from prototype
- [ ] Production stack deployment
CHANGELOG_EOF
  echo "  ✅ CHANGELOG.md created"
else
  echo "  ⚠️  CHANGELOG.md already exists, skipping (manual update recommended)"
fi

echo ""
echo "========================================="
echo "  ✅ Documentation update complete!"
echo ""
echo "  Files modified:"
echo "    - ARCHITECTURE.md (account, region, version)"
echo "    - DEPLOYMENT.md (region, real staging values)"
echo "    - INFRASTRUCTURE.md (region)"
echo "    - API.md (region)"
echo "    - CORS.md (region if applicable)"
echo "    - BRANDING-GUIDE.md (current palette added)"
echo ""
echo "  Files created:"
echo "    - STAGING-OUTPUTS.md (deployed resource reference)"
echo "    - CHANGELOG.md (deployment progress log)"
echo ""
echo "  Next: Review changes, then commit:"
echo "    git add docs/"
echo "    git commit -m 'docs: update after initial staging deployment'"
echo "    git push origin develop"
echo "========================================="
