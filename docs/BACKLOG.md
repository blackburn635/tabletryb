# TableTryb — Product Backlog

**Updated:** March 12, 2026

Items are prioritized roughly in order. Each item includes context on why it matters and what's involved.

---

## Backlog

### 1. Instacart Developer Platform (IDP) Integration

**Priority:** High — First post-launch feature
**Depends on:** Kroger OAuth complete, product launched with real users

#### Why

Instacart's IDP covers 85,000+ stores across 1,500+ retail banners in the US and Canada. Integrating it would upgrade many current Tier 2 stores (H-E-B, Publix, Costco, Safeway, Albertsons, etc.) to a cart-push-like experience, dramatically expanding coverage beyond the ~2,800 Kroger-network stores. IDP also includes an affiliate program (via Impact) that pays commissions on orders originating from partner apps — a secondary revenue stream that doesn't compromise user experience.

#### What's Involved

- **Apply to IDP** — requires a live product demo; stronger application after launch
- **API integration** — simpler than Kroger. No end-user OAuth flow. Send normalized ingredients → receive shoppable Instacart URL. Instacart handles product matching and checkout on their side
- **New Lambda(s)** — `POST /v1/households/{householdId}/grocery-list/{weekId}/instacart-link`
- **Frontend** — add "Shop with Instacart" button on grocery list alongside existing "Push to Cart" (Kroger) and search links
- **Store config update** — new tier concept (e.g., `instacart-handoff`) or flag on existing Tier 2 stores indicating Instacart availability
- **Affiliate tracking** — integrate Impact attribution parameters into generated URLs
- **Instacart's documented timeline:** ~19 days average for build + demo submission, 1–2 days for production key approval

#### Tiered Model Update

| Tier | Integration | Stores |
|------|------------|--------|
| **1A: Direct Cart Push** | Kroger OAuth + cart API | Kroger network (~2,800 stores) |
| **1B: Instacart Handoff** | IDP API → shoppable URL | 85,000+ stores, 1,500+ banners |
| **2: Search Links** | URL-based search | Stores not on Instacart where user prefers in-store |
| **3: List Export** | Copy/share | Universal fallback |

#### References

- Instacart Developer Platform: https://www.instacart.com/company/business/developers
- IDP API docs: https://docs.instacart.com/developer_platform_api/
- Affiliate/conversion tracking: https://docs.instacart.com/developer_platform_api/guide/concepts/launch_activities/conversions_and_payments/
- Current grocery architecture: `docs/GROCERY-STORES.md`

---

*Add new items above this line. Keep each item structured with Why, What's Involved, and References.*
