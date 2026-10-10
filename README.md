# CreatorHub Creator Portal

First version of the Creator Portal for CreatorHub, a platform where digital creators publish video and earn when viewers buy access.

Built with **Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS 3**. No external services or database are needed.

| Document | What it covers |
|---|---|
| This README | Setup, demo controls, assumptions, limitations, engineering judgment |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Part Five: upload/processing/storage/streaming design, diagram, scale, cost estimate |
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Part Six: three product recommendations |
| [`AI-USAGE.md`](AI-USAGE.md) | How AI tools were used |

## Quick start

Requires **Node 18.17+** (tested on Node 20).

```bash
npm install
npm run dev          # http://localhost:3000
```

Other commands:

```bash
npm test             # unit tests (publishing rule, validation, stats, seed data)
npm run typecheck    # tsc --noEmit
npm run build && npm start   # production build
npm run reset-demo   # delete persisted data; re-seeds on next request
```

## What's in the app

| Brief section | Where |
|---|---|
| Part 1: Dashboard | `/`: 4 stat cards, revenue/purchases chart (7/30/60 days), content table, recent purchases. **Search, filter, sort and pagination** are all implemented (server-side) on both lists. |
| Part 2: Create & publish | `/content/new` and `/content/[id]/edit`: validation, error handling, success toasts, simulated multipart upload with progress, cancel, and **resume after failure**. |
| Part 3: Verification | `/verify`: 4-step wizard (details, ID document, identity check, confirmation). Progress survives a refresh. |
| Publishing rule | Enforced **server-side** in `POST /api/content` and `PATCH /api/content/[id]` (`src/lib/rules.ts`). Drafts are always allowed; publishing **or scheduling** needs a verified creator. |
| Part 4: States | Loading skeletons, empty states, error states with retry, field validation, success toasts, confirmation dialogs before delete and reset. |
| Part 5: Architecture | `docs/ARCHITECTURE.md` (Mermaid diagram included) |
| Part 6: Product | `docs/PRODUCT.md` |

### The unverified-publish experience
When an unverified creator chooses **Publish** or **Schedule** and submits, a dialog explains why and offers: **Save draft & verify** (primary; nothing they entered is lost), **Save as draft**, or **Keep editing**. If their verification is *in review*, the dialog says so and doesn't push them back into the flow. The same dialog appears if the server rejects with `403 VERIFICATION_REQUIRED` (e.g. status changed in another tab).

## Demo controls (bottom-right button, "Demo controls")

| Control | What it does |
|---|---|
| Verification status | Switch between **Not verified / In review / Verified**. Submitting the wizard sets *In review*; set **Verified** here to simulate approval. |
| API latency | Adds 0 / 1.2 s / 4 s per request so loading states are visible. |
| Fail API requests | Dashboard, lists and saving return `503`, which shows the error states and retry buttons. |
| Fail next video upload | The next upload stops at 60%; **Resume upload** continues from the last part. |
| Reset demo data | Restores seed data and verification to *Not verified* (with confirmation). |

**Suggested walkthrough:** open the dashboard, then **New video**, fill the form, choose *Publish now* (blocked, see the dialog), choose **Save draft & verify**, complete the wizard, use Demo controls to set **Verified**, edit the draft and publish it. Try the *Fail next video upload* toggle first for the resume flow.

## Seed data, persistence and reset

- **14 content records** (8 published, 3 drafts, 3 scheduled) and **72 purchases** (completed, pending, refunded, failed) across 12 countries; all synthetic and deterministic (`src/lib/seed.ts`). Purchase dates are relative to the moment of seeding so "Revenue this month" and the chart are never empty.
- Revenue counts **completed** purchases only. Content-level purchases/revenue are derived from purchase records, so numbers always reconcile.
- **Persistence:** data is stored in `.data/db.json` (git-ignored). It **survives page refreshes and server restarts**. If the filesystem is read-only (e.g. serverless) it falls back to in-memory storage, which resets on cold start.
- **Reset:** use *Demo controls, Reset demo data*, or `npm run reset-demo` (then reload), or delete `.data/`.
- The seed represents synthetic history; the demo starts as *Not verified* so the gating flow is the first thing a reviewer can try. The publishing rule applies to **new** publish/schedule actions, not to the seeded history.

## Tests

`npm test` runs Vitest unit tests on the pure logic: the publishing rule (including *in review*), content and identity validation, revenue/series calculations, and seed-data minimums. API behaviour was also exercised end-to-end against a production build with `curl` (403 on unverified publish and schedule, 201 on drafts, 422 with field errors, 503 failure injection, persistence).

## Assumptions

- A single signed-in creator; no real authentication.
- Price is in USD, $0.99-$499.99. Drafts need only a title; publish/schedule needs title, description (20+ chars), price, thumbnail and video.
- **Scheduling counts as publishing** for the verification rule, since it commits content to go live.
- Revenue is gross (before platform fees); the product doc suggests showing net.
- Video is not stored: the file name, size and duration are recorded, and the upload is simulated. Thumbnails are downscaled to 640px JPEG and stored as data URLs.
- Scheduled content does not actually flip to *Published* at its time (no scheduler in the demo).

## Limitations

- No real auth, database, media storage, payments or identity provider.
- Video playback on the detail page is a placeholder.
- Single-process JSON store: no concurrency control, fine for a demo only.
- No end-to-end browser tests; accessibility was built in (labels, focus management, ARIA, 44px targets, reduced-motion) but not audited with a screen reader.
- Verification review is not automatic; approval is a demo control.
- Not tested on physical devices; layouts were designed mobile-first (bottom tab bar, card lists instead of tables under 768px, sticky action bar, 16px inputs to avoid iOS zoom).

## Time spent

_Edit before submitting: approx. X hours._

## What I'd do next

1. **Playwright tests** for the three critical flows (draft, then gate, then verify, then publish; delete confirmation; upload failure and resume). They guard the money and trust paths.
2. **Real upload manager** with presigned multipart to object storage (see architecture), moving upload out of the form (Product rec. 1).
3. **Draft readiness checklist** and return-to-draft after verification (Product rec. 2).
4. Auth, Postgres, and a payments sandbox with the entitlement state machine.

---

# Engineering judgment

### Architecture
Next.js App Router with **route handlers as the backend**, because the brief requires a real endpoint for the publishing rule and this keeps the whole thing in one runnable repo. Layers are deliberately thin:

- `src/lib/rules.ts`, `validation.ts`, `stats.ts` are **pure functions** with no framework dependencies. They hold the business rules, are unit-tested, and are shared between client (fast feedback) and server (authority).
- `src/lib/db.ts` is the only persistence code; swapping it for Postgres touches one file.
- `src/lib/http.ts` gives every route a uniform error envelope (`{ error: { code, message, fields } }`), so the UI maps errors to field messages, banners or the verification dialog by `code`.
- UI is split by feature (`components/dashboard`, `ContentForm`, `VerifyWizard`) with shared primitives in `ui.tsx`. Lists use **server-side** search/filter/sort/pagination so the client contract doesn't change when the data grows.
- I avoided heavy dependencies (no chart library, form library or state manager): the chart is ~100 lines of SVG, state is local or one small context. Fewer dependencies means a smaller bundle (dashboard first load ~105 kB) and less to explain.

**The key decision:** the server enforces the rule and the client only *explains* it. The UI never relies on being correct for security.

### Scale
For millions of users: Postgres with proper indexes (and read replicas) in place of the JSON file; cursor-based pagination instead of offset; Redis for counters; aggregate revenue into precomputed daily rollups instead of scanning purchases; move analytics to a columnar store; background jobs for scheduled publishing; CDN for static assets and API caching where safe. Video-specific scaling is covered in `docs/ARCHITECTURE.md`.

### Security
Before production: real authentication (session cookies, CSRF protection, MFA for payouts); **object-level authorization** on every content/purchase route (a creator may touch only their own); server-side validation (already in place, to be hardened with a schema library); rate limiting and upload quotas, especially for unverified accounts; presigned URLs scoped to key, size and content type; identity documents stored encrypted in a separate, access-logged bucket with short retention and a vetted KYC provider rather than our own storage; secrets management; security headers/CSP; remove the `/api/demo/*` routes; audit logging for verification and publishing; PII minimisation and deletion flows. Paid-content protection is detailed in the architecture doc.

### Performance
Keep route bundles small and code-split per route (already per-page); server components for static shells and server-side fetching for the first dashboard paint; virtualise or paginate long lists (pagination is already server-side); debounce search (done); stale-while-revalidate so lists don't flash empty while refetching (done); thumbnails served as properly sized, CDN-cached images (not data URLs) with `next/image`; avoid layout shift with skeletons that match the final layout (done); introduce a data-fetching library (TanStack Query) for cache and dedupe when screens multiply; track Core Web Vitals and set bundle-size budgets in CI.

### Reliability
| Failure | Behaviour |
|---|---|
| **Upload interrupted** | Parts already sent are kept; **Resume upload** continues from the last completed part (implemented in the demo). Production uses `ListParts` to resume across reloads and devices. |
| **Video processing fails** | Retries, then `processing_failed` with a reason shown to the creator and a retry button; publishing is blocked until `ready`. |
| **CDN unavailable** | Player falls back to a secondary CDN/origin URL; manifests and thumbnails degrade gracefully; the dashboard (which never touches the CDN) is unaffected. |
| **API unavailable** | Every dashboard section fails *independently* with a message and Retry (try "Fail API requests"); previously loaded data stays visible if a refresh fails; the form keeps the creator's input and shows an error banner. |
| **Payment succeeds, video authorization fails** | Entitlement is created transactionally or via an outbox with retries; UI shows "unlocking" and retries; a reconciliation job repairs or auto-refunds. The user is never left charged without access. |

### Observability
Request rate/latency/error rate per route; publish-gate rejections (`VERIFICATION_REQUIRED`) as a product metric; verification funnel by step and time-in-review; upload start/complete/resume rates; processing queue depth and failure reasons; playback authorization failures; CDN cache-hit ratio and time-to-first-frame; frontend errors and Core Web Vitals (RUM); and cost per view with anomaly alerts. Structured logs with a request id propagated from the browser.

