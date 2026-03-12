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
