#!/usr/bin/env bash
# update-docs.sh — Update documentation for $4.99 price change + FAQ page
# Run from project root: bash update-docs.sh
set -euo pipefail

echo "=== Updating docs ==="

# ─────────────────────────────────────────────────────────────
# 1. SUBSCRIPTION.md — Update monthly price $5.99 → $4.99
# ─────────────────────────────────────────────────────────────

# Plan Structure table: monthly price
sed -i '' 's/| Monthly price | \$0 | \$5\.99\/mo |/| Monthly price | $0 | $4.99\/mo |/' docs/SUBSCRIPTION.md

# Plan Structure table: annual savings (was 30%, now ~17% at $4.99/mo)
sed -i '' 's/| Annual price | \$0 | \$49\.99\/yr (save 30%) |/| Annual price | $0 | $49.99\/yr (save ~17%) |/' docs/SUBSCRIPTION.md

# Chargebee Setup Checklist: monthly plan reference
sed -i '' 's/Create plan: `tabletryb-monthly` (\$5\.99\/mo/Create plan: `tabletryb-monthly` ($4.99\/mo/' docs/SUBSCRIPTION.md

echo "  ✓ SUBSCRIPTION.md — updated monthly price to \$4.99, savings to ~17%"

# ─────────────────────────────────────────────────────────────
# 2. CHANGELOG.md — Append new entry
# ─────────────────────────────────────────────────────────────

cat >> docs/CHANGELOG.md << 'ENTRY'

## March 12, 2026 — FAQ Page & Pricing Update

### New Features
- **FAQ page**: Added public FAQ page (`/faq`) with accordion-style layout across 6 categories — General, Pricing & Billing, Recipe Import & AI, Family Voting & Meal Planning, Grocery Lists & Store Integrations, and Account & Privacy
- Added FAQ link to public nav bar (between Pricing and Contact) and footer
- Updated in-app Support page: FAQ card now links to the public FAQ page instead of showing "Coming soon"

### Pricing Change
- Monthly price changed from $5.99/mo to $4.99/mo
- Annual price unchanged at $49.99/yr (savings updated from 30% to ~17%)

### Files Added
- `frontend/src/pages/public/FaqPage.tsx` — FAQ page component with accordion
- FAQ section styles appended to `frontend/src/styles/global.css`

### Files Modified
- `frontend/src/App.tsx` — added FaqPage import and `/faq` route
- `frontend/src/components/layout/PublicLayout.tsx` — added FAQ to nav and footer links
- `frontend/src/pages/app/SupportPage.tsx` — FAQ card links to `/faq`
- `packages/shared/src/types/subscription.ts` — monthly price 599 → 499
- `docs/SUBSCRIPTION.md` — updated price references
ENTRY

echo "  ✓ docs/CHANGELOG.md — appended FAQ & pricing entry"

# ─────────────────────────────────────────────────────────────
# 3. Ensure CHANGELOG.md is tracked by git
# ─────────────────────────────────────────────────────────────

git add docs/CHANGELOG.md

echo "  ✓ docs/CHANGELOG.md — staged for commit"

echo ""
echo "=== Done! Verify with: ==="
echo "  grep -n '4\.99\|5\.99\|save\|17' docs/SUBSCRIPTION.md"
echo "  tail -30 docs/CHANGELOG.md"