# TableTryb — CORS Configuration

## How CORS Works in This Architecture

CORS is handled at two layers, both of which must agree for requests to succeed.

```
Browser makes cross-origin request
│
├─ OPTIONS preflight?
│  └─ API Gateway handles it directly (no Lambda invoked)
│     Returns: Access-Control-Allow-Origin, Methods, Headers
│     Configured in: CDK stack → HttpApi.corsPreflight
│
└─ Actual request (GET/POST/PUT/DELETE)?
   └─ API Gateway → Lambda (proxy integration, pass-through)
      └─ Lambda response MUST include CORS headers
         Configured in: backend/functions/_shared/response.ts
         Applied to: every response including errors
```

## Layer 1: API Gateway Preflight (OPTIONS)

Before any cross-origin POST/PUT/DELETE, the browser automatically sends an OPTIONS preflight request. API Gateway intercepts this and responds without invoking any Lambda.

**Staging stack** allows three origins:
- `https://staging.tabletryb.com` — Amplify-hosted staging site
- `http://localhost:3000` — local React dev server
- `http://localhost:3001` — alternate dev port

**Production stack** allows two origins:
- `https://tabletryb.com` — main site
- `https://www.tabletryb.com` — www variant

Configuration is in `infrastructure/lib/tabletryb-stack.ts`:
```typescript
corsPreflight: {
  allowOrigins: stage === 'prod'
    ? [`https://${domainName}`, `https://www.${domainName}`]
    : [`https://${domainName}`, 'http://localhost:3000', 'http://localhost:3001'],
  allowMethods: [GET, POST, PUT, DELETE, OPTIONS],
  allowHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
  allowCredentials: true,
  maxAge: Duration.hours(24),  // Browser caches preflight for 24hrs
}
```

## Layer 2: Lambda Response Headers (Actual Requests)

Because we use **proxy integrations** (API Gateway v2 HTTP API always uses proxy), Lambda is responsible for setting CORS headers on every response. API Gateway passes through whatever Lambda returns.

**Key constraint:** `Access-Control-Allow-Origin` only accepts a **single value**, not a list. Since staging needs to support both `staging.tabletryb.com` and `localhost:3000`, we dynamically reflect the origin from the incoming request.

Configuration is in `backend/functions/_shared/response.ts`:
```typescript
// Build allowlist from environment
const ALLOWED_ORIGINS = process.env.STAGE === 'prod'
  ? ['https://tabletryb.com', 'https://www.tabletryb.com']
  : ['https://staging.tabletryb.com', 'http://localhost:3000', 'http://localhost:3001'];

// Check incoming Origin header against allowlist, reflect if matched
export function getCorsHeaders(event?: APIGatewayProxyEventV2) {
  const requestOrigin = event?.headers?.origin || '';
  const matchedOrigin = ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[0];  // Fallback to primary

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': matchedOrigin,
    'Access-Control-Allow-Credentials': 'true',
  };
}
```

## Why Both Layers

| Scenario | Without Layer 1 | Without Layer 2 |
|----------|----------------|-----------------|
| Browser sends OPTIONS | Lambda gets invoked unnecessarily (cost + latency) | Preflight fails, browser blocks request |
| Browser sends POST | Works but OPTIONS fails, so POST never happens | Browser sees response but no CORS headers → blocks it |
| Lambda throws exception | API Gateway returns 500 with no CORS headers → browser shows CORS error instead of real error | N/A |

Both layers are required. Our `error()` function in `response.ts` ensures CORS headers are present even on unhandled exceptions, preventing the common trap where a Lambda crash appears as a CORS error.

## Proxy vs Non-Proxy

**Our Lambdas are proxy integrations.** API Gateway v2 (HTTP API) always uses proxy integration — there is no non-proxy option like REST API v1 had. This means:

- Lambda receives the raw HTTP request (headers, body, path params, query params)
- Lambda returns the full HTTP response (status code, headers, body)
- API Gateway does not transform anything in either direction
- Lambda is responsible for setting CORS headers on responses

## CORS Summary By Origin

| Request From | Environment | Preflight | Lambda Header |
|---|---|---|---|
| `localhost:3000` | Local dev → staging backend | ✅ Allowed | ✅ Reflected |
| `staging.tabletryb.com` | Staging Amplify → staging backend | ✅ Allowed | ✅ Reflected |
| `tabletryb.com` | Prod Amplify → prod backend | ✅ Allowed | ✅ Reflected |
| `www.tabletryb.com` | Prod Amplify → prod backend | ✅ Allowed | ✅ Reflected |
| `evil-site.com` | Anywhere | ❌ Blocked | Falls back to primary (browser rejects mismatch) |

## Common CORS Pitfalls (Avoided)

1. **Error responses without CORS headers** — our `error()` function always includes them
2. **Wildcard origin with credentials** — `*` is incompatible with `credentials: true`. We use explicit origins
3. **Origin mismatch between layers** — both layers are driven by the same `stage` parameter and `ALLOWED_ORIGIN` env var
4. **Staging domain missing** — initially only had localhost; fixed to include Amplify staging domain
5. **Single-origin limitation** — solved with dynamic reflection from request Origin header
