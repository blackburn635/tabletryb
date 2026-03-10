# TableTryb — CDK Infrastructure

## Why CDK (Not SAM)

The prototype used SAM (CloudFormation YAML). We converted to CDK (TypeScript) for the commercial version because:

- **Consistency with Cloudscribble** — same IaC tooling across both businesses
- **TypeScript everywhere** — frontend, backend, and infrastructure all in one language
- **Less code** — 647 lines of CDK vs 1,084 lines of SAM YAML (40% reduction)
- **Reusable constructs** — `TrybFunction` construct eliminates repetitive Lambda definitions
- **Type safety** — misspell a property and your IDE catches it before deployment
- **Multi-environment from code** — same class, two instantiations, fully isolated stacks

Both CDK and SAM generate CloudFormation templates. The AWS resources are identical — only the authoring experience differs.

---

## File Structure

```
infrastructure/
├── bin/
│   └── app.ts                      # CDK app entry — creates staging + prod stacks
├── lib/
│   ├── tabletryb-stack.ts          # Main stack: all AWS resources
│   └── constructs/
│       └── tryb-function.ts        # Reusable Lambda construct
├── cdk.json                        # CDK configuration
├── package.json                    # CDK dependencies
└── tsconfig.json                   # TypeScript config
```

## Stacks

The CDK app (`bin/app.ts`) creates two stacks from the same `TableTrybStack` class:

| Stack Name | Stage | Domain | Branch |
|------------|-------|--------|--------|
| `TableTryb-staging` | `staging` | `staging.tabletryb.com` | `develop` |
| `TableTryb-prod` | `prod` | `tabletryb.com` | `main` |

Each stack creates its own completely isolated set of resources. No resources are shared between environments.

## AWS Resources Per Stack

| Resource | CDK Construct | Naming Pattern |
|----------|--------------|----------------|
| DynamoDB Table | `dynamodb.Table` | `tabletryb-{stage}` |
| Cognito User Pool | `cognito.UserPool` | `tabletryb-{stage}` |
| Cognito Client | `cognito.UserPoolClient` | `tabletryb-web-{stage}` |
| S3 Bucket | `s3.Bucket` | `tabletryb-images-{accountId}-{stage}` |
| HTTP API | `apigatewayv2.HttpApi` | `tabletryb-api-{stage}` |
| 25 Lambda Functions | `TrybFunction` (custom) | `tabletryb-{name}-{stage}` |
| CloudWatch Alarms | `cloudwatch.Alarm` | `tabletryb-*-{stage}` |

## TrybFunction Construct

The `TrybFunction` construct standardizes all Lambda functions:

```typescript
// 5 lines instead of 25 lines of YAML
const recipesAnalyze = new TrybFunction(this, 'RecipesAnalyze', {
  stage, sharedEnv,
  entry: 'recipes/analyze.ts',
  timeout: 90,
  memorySize: 512,
  policies: [dynamoReadPolicy],
});
```

**Defaults applied by TrybFunction:**
- Runtime: Node.js 20
- Architecture: ARM64 (Graviton) — 20% cheaper
- Memory: 256 MB
- Timeout: 30 seconds
- Bundling: esbuild (minified, source maps, external @aws-sdk)
- Tags: Project=TableTryb, Stage={stage}
- Environment: all shared env vars (TABLE_NAME, STAGE, etc.)

## Environment-Specific Behavior

| Behavior | Staging | Production |
|----------|---------|------------|
| DynamoDB RemovalPolicy | DESTROY | RETAIN |
| Cognito RemovalPolicy | DESTROY | RETAIN |
| S3 auto-delete objects | Yes | No |
| S3 RemovalPolicy | DESTROY | RETAIN |
| CORS origins | staging domain + localhost | prod domain + www |
| CDK deploy approval | `--require-approval never` | `--require-approval broadening` |

## Commands

```bash
# Preview what would change
npm run diff:staging
npm run diff:prod

# Deploy
./deploy.sh staging
./deploy.sh prod

# Synthesize CloudFormation (without deploying)
npm run synth

# Destroy (staging only — prod has RETAIN policies)
cd infrastructure && npx cdk destroy TableTryb-staging
```

## Secrets

Secrets are passed as environment variables during deployment (not stored in CloudFormation):

| Variable | Source | Description |
|----------|--------|-------------|
| `ANTHROPIC_API_KEY` | GitHub Secrets / env var | Claude API key |
| `CHARGEBEE_SITE` | GitHub Secrets / env var | Chargebee site name |
| `CHARGEBEE_API_KEY` | GitHub Secrets / env var | Chargebee API key |
| `CHARGEBEE_WEBHOOK_SECRET` | GitHub Secrets / env var | Webhook signature verification |
| `KROGER_CLIENT_ID` | GitHub Secrets / env var | Kroger API client (optional) |
| `KROGER_CLIENT_SECRET` | GitHub Secrets / env var | Kroger API secret (optional) |

---

*For future consideration: move secrets to AWS Secrets Manager and reference via CDK `secretsmanager.Secret.fromSecretNameV2()` instead of environment variables.*
