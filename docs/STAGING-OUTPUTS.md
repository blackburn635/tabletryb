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
