# AppleLab — Phase-by-Phase Development Plan

**Companion to:** `AppleLab_PRD.md` and `Design/uploads/AppleLab_Design_Plan.md`
**Target builder:** AI coding agent, executing **one phase at a time**
**Build strategy:** MVP-first on top of the existing Django + Next.js boilerplate. Post-MVP features are fully specced at the end (Part VII) so nothing is lost.
**Version:** 1.0 · **Date:** May 2026

---

> ## ⚠️ AMENDED — READ `Master_Build_Plan.md` FIRST (August 2026)
>
> This project is now part of a **two-repo build**:
> - **`https://github.com/nafew0/bp-company.git`** — the reusable service-provider template (upstream)
> - **`https://github.com/nafew0/applelab.git`** — this site, **derived from the template**
>
> `Master_Build_Plan.md` is the controlling document. It defines the phase order (BP-0…BP-4 → AL-0…AL-13 → BP-5…BP-9), the **Sync Gate** that ends every phase (generic changes must be propagated/harvested between BOTH repos before a phase is done), the Playwright/CI testing standard, and **§8 Amendments** that supersede parts of this file — most importantly:
> - Do **not** run Phase 0–3 of this plan as written (superseded by template phases BP-0–BP-3 + AL-0).
> - There is **no standalone `RepairRequest` model**: a repair request = template `leads.Lead` + `repairs.RepairDetail` (OneToOne); repair statuses = configured `PipelineStage`s; ticket IDs = the generic reference service (`APL-` prefix).
> - Analytics/Pixel (Phase 17) and Meta CAPI (Phase 27) moved to template phase BP-6.
>
> This file remains the **authoritative detailed spec** (features, edge cases, DoD) for the AL phases, applied on the amended data model. When this file and `Master_Build_Plan.md` conflict, the Master plan wins.

---

## 0. How to use this document

- Build **one phase at a time, in order**. Do not start a phase until its `Depends on` phases are merged and green.
- Each phase is written to be **self-contained**: it states what to reuse, what to clear out, what to build, the edge cases to handle, and a **Definition of Done (DoD)** checklist.
- **Do not regress the boilerplate's working auth, admin shell, or build.** Every phase must end with `backend` migrations applied cleanly, `npm run build` passing, and existing auth/admin routes still functional.
- When a phase says "reuse," **extend the existing pattern**, do not reinvent it. When it says "clear/hide," prefer **hiding/feature-flagging over deleting** unless deletion is explicitly stated (keeps git history and the option to re-enable).
- Write tests as you go (see §3 Testing Standard). A phase is not done without them.

---

## 1. What we are building (scope lock)

The client's core asks, in priority order:

1. **Guided device selection** — pick Apple **product → year → model** from a catalog, in an easy, simple flow.
2. **Issue selection + intake** — pick a damage/repair option (with an **"Other / not listed"** path), then share **details + photos** in a form.
3. **Owner notification + request queue** — owner receives an **email** and sees a **request list** in the admin panel.
4. **Respond + WhatsApp** — owner updates/responds in the system and **messages the customer on WhatsApp** from there.
5. **Simple finance CRM** — very simple customer management focused on **invoicing** (customers, invoices, payments, A5 invoice with a **left-form / right-live-preview** editor).

**Decisions already locked:**

- **MVP-first.** Device selector is **request-capture only** (no instant price shown to the customer). Pricing/quote engine, AI chat, blog, trade-in, corporate, deposits, Meta CAPI, SMS are **Post-MVP** (Part VII).
- **Bilingual EN / বাংলা is a launch requirement** via `next-intl` with file-based `messages/en.json` + `messages/bn.json` (translating = editing a JSON file). **Public site is locale-routed; the admin panel + auth stay English.**
- **CRM/admin lives in the existing custom React admin** (`/admin/*` + `/api/admin/...`), not django-unfold.
- **Repair customers do not log in.** `Customer` is a standalone CRM record; `accounts.User` is staff/owner only.
- **The SaaS surface (public register, pricing, subscriptions, Stripe) is hidden**, not exposed to AppleLab visitors.

---

## 2. Boilerplate Triage — Reuse / Clear / Hide

The starter is a **Django 5.2 + DRF** backend and a **Next.js 16.2 (App Router) + React 19 + Tailwind 3.4** frontend with JWT auth, a custom React admin, Celery/Redis, and Stripe+bKash. Map every part before writing code.

### 2.1 Backend

| Area | Action | Notes |
|---|---|---|
| `accounts` app (User UUID PK, JWT, email verify, password reset, `SiteSettings`, admin gate) | **Reuse fully** | Owner/staff log in here. `User` already has `phone`, `organization`, `designation`. |
| `accounts/admin_views.py` + `admin_urls.py` (`/api/admin/...`, `AdminGateView`, dashboard, users, payments, settings) | **Reuse & extend** | New admin endpoints follow this exact pattern + staff permission + gate. |
| Auth/JWT/cookie/throttles/CSP middleware | **Reuse** | Keep. Add throttles for new public endpoints. |
| Celery + Redis (`subscriptions/tasks.py` patterns) | **Reuse (optional at MVP)** | Use for async email if desired; synchronous email is acceptable for MVP. |
| Email infra (verification + password-reset templates) | **Reuse pattern** | Clone the template/sending pattern for owner + customer notifications. |
| `subscriptions` app (Plan, UserSubscription, Stripe, bKash, SNS) | **Keep installed, leave dormant** | Do **not** wire `LicenseService` limits to AppleLab models. Remove `subscriptions` URLs from public nav. Keep `bkash_service.py` for Post-MVP deposits (Phase 26). Remove/disable Stripe public flows. |
| `SiteSettings.ai_provider / ai_model_*` | **Keep** | Reused by Post-MVP AI chat (Phase 22). |
| `Pillow` | **Reuse** | Photo intake + image re-encode. |
| `channels` | **Keep dormant** | Not needed for MVP (chat uses SSE in Post-MVP). |
| New apps `core`, `repairs`, `crm` | **Create** | Registered in `backend/applelab/urls.py` under `/api/`. |

### 2.2 Frontend

| Area | Action | Notes |
|---|---|---|
| `src/app/admin/*`, `src/views/admin/*` (`AdminLayout`, `AdminRoute`, `AdminDashboard`, `admin-helpers.ts`) | **Reuse & extend** | All new admin screens (repairs, customers, invoices, finance) plug in here. `AdminRoute` already gates on `is_staff`. |
| `src/services/*` (`api.ts` axios + JWT interceptors, `admin.ts`) | **Reuse & extend** | Add `repairs.ts`, `crm.ts`, `catalog.ts`, `site.ts`; reuse the axios instance + refresh interceptor. |
| `AuthContext`, `providers.tsx` (React Query, Toast, Theme) | **Reuse** | Keep for admin. Public site can use a lighter provider tree. |
| `components/ui/*` (shadcn/radix), `@tanstack/react-table`, `recharts`, `lucide-react` | **Reuse** | Tables for admin lists, recharts for finance dashboard, lucide for icons. |
| Public marketing: `views/Home.tsx`, `Pricing.tsx`, `Register.tsx`, `PaymentSuccess/Failed`, `Dashboard.tsx` (end-user), `Profile.tsx` (end-user) | **Replace / hide** | Build AppleLab public site fresh from the Design Plan. Remove SaaS landing, pricing, public registration, and end-user dashboard from public routing/nav. Keep `Login` for staff. |
| `Navbar.tsx` (SaaS nav + subscription badge) | **Replace** | New AppleLab public navbar (per Design Plan §5.2) with EN/বাংলা toggle + "Book a Repair". Admin keeps its own layout. |
| `next.config.ts` rewrites (`/api/*` → backend `/api/*/`, `/media/*`) + strict CSP | **Reuse & extend** | CSP must be widened per integration (Google Maps, GTM/GA, Meta Pixel) — see §4.6. |
| Flat route structure (no `[locale]`) | **Refactor (Phase 2)** | Wrap **public** routes in `[locale]`; leave `admin`, `login`, auth routes locale-free. |

### 2.3 Things to explicitly remove from the public experience

- Public **/register**, **/pricing**, **/payment/success|failed**, end-user **/dashboard**, end-user **/profile**, subscription badges, "Upgrade" CTAs.
- Stripe publishable key usage in public UI.
- Any boilerplate copy referencing "SaaS", "plans", "subscription".

> Keep the code paths intact where low-risk; just unroute/unlink them. Staff still authenticate via `/login` to reach `/admin`.

---

## 3. Global conventions (apply to every phase)

### 3.1 Naming & model reconciliation (supersedes PRD §7 where they differ)

The PRD's free-text `device_model` cannot support the cascading **product → year → model** requirement. Use this catalog instead:

| Concept | Model | App | Replaces PRD |
|---|---|---|---|
| Apple product line (iPhone, MacBook Pro…) | `DeviceCategory` | `core` | `core.DeviceType` |
| Specific model + year (iPhone 14 Pro, 2022) | `DeviceModel` *(NEW)* | `core` | — |
| Damage/repair option | `Issue` | `core` | `core.CommonIssue` |
| Repair intake | `RepairRequest` | `repairs` | `repairs.Booking` (trimmed: no slots/deposit at MVP) |
| Status timeline | `RepairStatusHistory` | `repairs` | `repairs.BookingStatusHistory` |
| CRM customer | `Customer` *(NEW)* | `crm` | — |
| Invoice / lines / payment | `Invoice`, `InvoiceItem`, `Payment` *(NEW)* | `crm` | — |

Keep the PRD's bilingual `_en` / `_bn` field convention and `?lang=` serializer param.

### 3.2 API conventions

- All DRF routes end with **trailing slash** (the Next rewrite appends `/`). Register app URLs in `backend/applelab/urls.py`.
- **Public read/write** endpoints under `/api/...` (e.g. `/api/catalog/...`, `/api/repairs/...`). **Staff** endpoints under `/api/admin/...`, permission `IsAdminUser` (`is_staff`), behind the existing admin gate pattern.
- Serializers accept `?lang=en|bn` and return the matching localized fields (default `en`, fall back to `en` if `bn` empty).
- Every public **POST** endpoint is **rate-limited** (reuse `throttles.py`) and protected against bots (honeypot field + optional captcha, reuse `RegisterCaptchaView` pattern).

### 3.3 Money, numbers, dates

- Currency is **BDT (৳)** only. Store money as `DecimalField(max_digits=12, decimal_places=2)`. **Never use floats.** All totals computed **server-side**; never trust client-sent totals.
- Timezone **Asia/Dhaka**. Ticket/invoice month prefixes and "today/this week" stats use Dhaka local time.
- Locale formatting: prices/dates formatted per locale on the frontend. **Default to Western digits for money** even in `bn` (avoids payment ambiguity); Bengali digits allowed for body/dates only if explicitly wanted.

### 3.4 Sequential IDs (ticket & invoice) — concurrency-safe

`APL-YYYYMM-NNNNN` (ticket) and `INV-YYYYMM-NNNN` (invoice) must be **collision-free under concurrency**. **Do not** use `Model.objects.count()+1` (the PRD's sample has a race condition). Instead use one of:
- a dedicated `DocumentCounter` table with `select_for_update()` inside `transaction.atomic()`, or
- a Postgres sequence per prefix, or
- retry-on-IntegrityError loop against the `unique=True` column.

Pad to fixed width; reset numbering per month.

### 3.5 Bilingual gotcha — fonts

SF Pro / the system font stack in the Design Plan **does not render Bengali**. Add a Bengali web font (e.g. **Noto Sans Bengali** or **Hind Siliguri**) and apply it for the `bn` locale (and anywhere Bengali text appears, including invoices and emails). Define a `--font-bn` stack and switch `lang`/`font-family` by locale. Verify Bengali renders on Windows/Android, not just Apple devices.

### 3.6 Testing standard (Definition of Done is incomplete without this)

- **Backend:** `pytest-django` — model methods (numbering, totals, status transitions), serializer validation, each endpoint (happy path + auth + validation + edge), and permissions (public vs staff).
- **Frontend:** component/interaction tests for the wizard and the invoice editor; build (`npm run build`) and lint must pass.
- **Manual QA checklist** per phase (in the phase's DoD), run in **both locales**.
- Keep a seed/fixture command current so any phase can be demoed from a clean DB.

### 3.7 Media & privacy

- Customer repair photos are **private** (device contents, serials). Serve via **authenticated/admin-only** access, not guessable public URLs. The customer's own confirmation page should not expose other customers' media. (MVP may store on local disk via `MEDIA_ROOT`; protect the path. S3/R2 is Post-MVP.)
- Re-encode uploaded images server-side to strip EXIF/GPS metadata.

---

## 4. Cross-cutting references

### 4.1 Status enums (repairs)

`PENDING → CONFIRMED → DIAGNOSED → IN_PROGRESS → READY → COMPLETED`, plus terminal `CANCELLED`, `NO_FIX`. Color map per Design Plan §2.6 `--status-*`.

### 4.2 Invoice status

`draft → sent → partially_paid → paid`, plus `cancelled`. Status is **derived from payments** where possible: `paid_total == 0 → sent/draft`, `0 < paid_total < total → partially_paid`, `paid_total >= total → paid`. `cancelled` is manual and locks the invoice.

### 4.3 Phone / WhatsApp normalization

Accept BD formats: `01XXXXXXXXX`, `+8801XXXXXXXXX`, `8801XXXXXXXXX`, with spaces/dashes. Normalize to **E.164 digits without `+`** (`8801XXXXXXXXX`) for WhatsApp deep links: `https://wa.me/8801XXXXXXXXX?text=<urlencoded>`. Store the normalized form + display form. Reject numbers that don't match a BD mobile pattern (with a clear error); allow an override note for non-BD numbers.

### 4.4 Owner/admin notifications

New repair request → email to `SiteConfig.email` (owner). Status change → optional email to customer (in their `lang_preference`). Use the existing email-sending pattern; make async via Celery only if trivially available, else synchronous with failure logging (never block/breaking the request on email failure).

### 4.5 SEO defaults

Per-page bilingual metadata, `hreflang` (`en`, `bn`, `x-default`), canonical, OpenGraph; `LocalBusiness` JSON-LD from `SiteConfig`; sitemap covering both locales; `robots` disallow `/admin`, `/api`.

### 4.6 CSP deltas (the current CSP is strict — widen deliberately, per feature)

- Google Maps embed → add `https://www.google.com` (and `https://maps.google.com`) to `frame-src`; map tiles to `img-src` (already `https:`).
- GTM/GA4 → add `https://www.googletagmanager.com` / `https://www.google-analytics.com` to `script-src` + `connect-src`.
- Meta Pixel → add `https://connect.facebook.net` (script) + `https://www.facebook.com` (img/connect).
- Bengali font (if self-hosted) → already covered by `font-src 'self'`; if from Google Fonts add `https://fonts.gstatic.com` (already present) + `https://fonts.googleapis.com` to `style-src`.
- Keep `frame-ancestors 'none'`, `object-src 'none'`. Add only what a shipped feature needs.

---

# PART I — FOUNDATION

## Phase 0 — Boilerplate triage, cleanup & project conventions

**Goal:** A clean, building baseline with the SaaS surface hidden, new apps scaffolded, conventions documented, and nothing broken.

**Depends on:** none.

**Reuse / Clear / Touch:** See §2. Touch `backend/applelab/{settings.py,urls.py}`, `frontend/next.config.ts`, public routing/nav.

**Backend**
- Create empty apps `core`, `repairs`, `crm`; add to `INSTALLED_APPS`; create `urls.py` in each and include them under `/api/` in `backend/applelab/urls.py`.
- Confirm `TIME_ZONE = "Asia/Dhaka"`, `USE_TZ = True`, `LANGUAGE_CODE` sensible.
- Confirm media config (`MEDIA_ROOT`, `MEDIA_URL`) and the dev media serving already in `urls.py`.
- Leave `subscriptions` installed but remove it from any public surface; do **not** delete migrations.
- Add a `DocumentCounter` utility (or sequence helper) per §3.4 for later use.

**Frontend**
- Remove public links/routes to `/pricing`, `/register`, `/payment/*`, end-user `/dashboard`, `/profile`; keep `/login` (staff) and `/admin/*`.
- Replace the SaaS `Navbar`/`Home` with placeholders (real builds in Phases 3–5) so the app still builds.
- Keep `AuthContext`, providers, admin shell intact.

**Edge cases & validation**
- App still builds and runs; **login → /admin still works**; migrations apply on a fresh DB.
- No dead links to removed SaaS pages; no console/CSP errors from removed Stripe scripts.

**DoD**
- [ ] `core`, `repairs`, `crm` created, migrated (even if empty), URL-included.
- [ ] SaaS public pages unrouted/hidden; staff login + admin reachable.
- [ ] `npm run build` + `pytest` pass; fresh-DB migrate clean.
- [ ] Short `CONTRIBUTING`/`CONVENTIONS` note committed capturing §3 (naming, API, money, IDs, i18n, testing).

---

## Phase 1 — Design system & UI foundation

**Goal:** The Apple-mirrored design tokens, fonts (incl. Bengali), and base components exist as reusable primitives.

**Depends on:** Phase 0.

**Reuse:** Tailwind 3.4 config, `components/ui/*`, `globals.css`, `lucide-react`.

**Frontend**
- Port **all tokens** from Design Plan §9 into `tailwind.config.js` `theme.extend` (colors: blue/cyan scales, grays, semantic, status; radii incl. `pill: 980px`; shadows; durations/eases) **and** a CSS-variable layer in `globals.css`.
- Fonts: SF system stack (`--font-display/-text`), `Geom Graphic` (logo only, self-hosted woff2 with `font-display: swap`), **`--font-bn` Bengali stack** (§3.5). Wire logo/icon SVGs from `Design/assets`.
- Build primitives to spec: `Button` (primary/gradient/secondary/ghost-dark/sm, pill), `Section` wrapper (alternating white/`#F5F5F7`/black backgrounds), `Eyebrow`, `Container` widths (1200/980/692/560), `Card`, `Reveal` (IntersectionObserver scroll-reveal + stagger), brand gradient helpers, `SectionDivider`.
- Light-only (no dark toggle); dark **sections** are explicit per design.

**Edge cases & validation**
- Token changes **must not break** existing admin/auth screens (scope new tokens; don't override shadcn variables the admin relies on, or update admin to match deliberately).
- Bengali text renders with `--font-bn` (verify a Bengali string in a primitive).
- `prefers-reduced-motion` disables scroll-reveal/animations.
- Gradient usage rule respected (max 2 gradient elements per viewport).

**DoD**
- [ ] Tokens in Tailwind + CSS vars; a `/_styleguide` (dev-only) page renders buttons, cards, type scale, colors, status chips in EN + BN.
- [ ] Geom Graphic loads for wordmark only; Bengali font loads for `bn`.
- [ ] Reduced-motion respected; build/lint pass.

---

## Phase 2 — Bilingual infrastructure (next-intl)

**Goal:** Public site is locale-routed EN/বাংলা with file-based messages; admin/auth remain English.

**Depends on:** Phase 1.

**Reuse:** `NEXT_LOCALE` cookie concept from PRD §6.

**Frontend**
- Install `next-intl`; add middleware for locale detection (`Accept-Language` + `NEXT_LOCALE` cookie), default `en`.
- Restructure **public** routes under `src/app/[locale]/...`. **Exclude** `admin`, `login`, `forgot-password`, `reset-password`, `verify-email`, `auth` from locale routing (keep English, ensure middleware matcher ignores them and `/api`, `/media`, static).
- Create `messages/en.json` + `messages/bn.json` (seed with the PRD §6.3 keys; expand as pages are built). Establish nested key namespaces (`nav`, `hero`, `wizard`, `status`, `footer`, …).
- `LanguageToggle` (nav + footer) switches locale preserving the current path; persists cookie.
- Locale-aware `<Link>`/navigation helpers; `lang` attribute + font switch per locale on `<html>`/body.

**Edge cases & validation**
- Missing key → fall back to EN (and log in dev), never render the raw key in prod.
- `/` redirects to a locale; deep links like `/bn/...` work and are shareable.
- Toggling language on any page keeps you on the same page in the other language.
- Admin/login are **not** locale-prefixed and still work.
- Bengali numerals/date/pluralization rules decided (per §3.3) and applied consistently.
- API `/api/*` and `/media/*` rewrites unaffected by the i18n middleware matcher.

**DoD**
- [ ] EN/BN routing live; toggle persists; admin/auth excluded.
- [ ] `messages/*.json` structured; fallback works; hreflang base wired (full SEO in Phase 16).
- [ ] Build/lint pass in both locales.

---

## Phase 3 — Public layout shell (Navbar, Footer, providers, SEO base)

**Goal:** Shared public chrome that every page renders inside.

**Depends on:** Phases 1–2; benefits from Phase 4's `/api/config` (can stub then wire).

**Frontend**
- `Navbar` per Design Plan §5.2/§10.1: sticky translucent (blur), logo + wordmark, center links, EN/বাংলা toggle, "Book a Repair" CTA; mobile hamburger → full-screen drawer; translucent-dark variant over dark sections.
- `Footer` per §10 Section 12: services/quick-links/contact/social columns (from `SiteConfig`), language toggle, copyright with dynamic year, privacy/terms links.
- Public layout: minimal providers (i18n; React Query only if a page needs it), skip-to-content link, focus management, sticky `WhatsApp`/`Book` affordance optional.
- Base metadata defaults (title template, description, OG) and the LocalBusiness JSON-LD slot (filled in Phase 16).

**Edge cases & validation**
- Navbar contrast adapts over white vs black sections; keyboard-navigable; mobile drawer traps focus and closes on route change/Esc.
- Footer NAP (name/address/phone) pulled from `SiteConfig` (single source of truth), localized.
- No layout shift from sticky nav (reserve height); `backdrop-filter` fallback for unsupported browsers.

**DoD**
- [ ] Navbar + Footer responsive, bilingual, accessible; render on all public routes.
- [ ] Contact/NAP from config (stub allowed); build/lint pass.

---

# PART II — CONTENT & CATALOG

## Phase 4 — Core backend: SiteConfig, device catalog, issues, content + seed + public APIs

**Goal:** The data backbone for the whole site, with a deterministic seed.

**Depends on:** Phase 0.

**Backend — models (`core/models.py`)**
- `SiteConfig` (singleton): phones, email, `address_en/bn`, `whatsapp_number`, `google_maps_embed_url`, social URLs, `business_hours_en/bn`, analytics IDs (pixel/ga4/gtm — used later). Enforce single row.
- `DeviceCategory`: `name_en/bn`, `slug` (unique), `icon` (Lucide name), `display_order`, `is_active`.
- `DeviceModel` *(NEW)*: `category` FK, `name_en/bn` (e.g. "iPhone 14 Pro"), `release_year` (PositiveSmallInteger), `slug`, `display_order`, `is_active`. Index `(category, release_year)`.
- `Issue` (was `CommonIssue`): `category` FK, `name_en/bn`, `icon`, `display_order`, `is_active`.
- Content models (used by later pages, define now): `ServicePage`, `Testimonial`, `FAQItem`, `TeamMember` (bilingual fields per PRD §7.2).

**Backend — public APIs (read-only, `?lang=`)**
- `GET /api/config/` — site config (NAP, whatsapp, socials, maps).
- `GET /api/catalog/categories/` — active categories ordered.
- `GET /api/catalog/years/?category={slug}` — distinct active years for a category (desc).
- `GET /api/catalog/models/?category={slug}&year={yyyy}` — active models filtered.
- `GET /api/catalog/issues/?category={slug}` — active issues for a category.
- `GET /api/testimonials/`, `GET /api/faq/?category=`, `GET /api/team/` (for later pages).
- Cache-friendly (short TTL / `Cache-Control`); these are public + high-traffic.

**Data & Seed (management command `seed_catalog`)**
- Seed `SiteConfig` with the real AppleLab NAP (PRD §1.2) + WhatsApp `8801603710044`.
- Seed the **9 categories** (MacBook Pro, MacBook Air, iPhone, iPad, iMac, Mac Mini, Mac Studio, Apple Watch, AirPods) with Lucide icons + order.
- Seed `DeviceModel`s with realistic **model + year** coverage per category (see Appendix A). Make the command **idempotent** (`update_or_create` by slug).
- Seed `Issue`s per category from PRD §4.2.2 table (Appendix B). Include a sentinel **"Other (not listed)"** issue per category OR handle "Other" purely in the form (decision: handle "Other" in the form as free text — see Phase 7/8 — but each category still needs its standard issues seeded).
- Seed a few `FAQItem`/`Testimonial` rows for the homepage.

**Edge cases & validation**
- Category with **no models** or **no years** → endpoints return empty arrays, not errors; frontend shows an "Other / not listed" fallback (Phase 8).
- Inactive category/model/issue excluded everywhere.
- `?lang=bn` with empty `bn` field → fall back to `en`.
- Singleton `SiteConfig` enforced (pk fixed / `get_or_create`); admin can't create a second.
- Slugs unique & stable (used in URLs); changing a slug shouldn't 500 the catalog.

**DoD**
- [ ] Models + migrations + DRF read APIs live; `?lang` works with fallback.
- [ ] `seed_catalog` idempotent; fresh DB → full catalog + config + sample content.
- [ ] Endpoint tests (filters, empty cases, lang fallback) pass.

---

## Phase 5 — Home page

**Goal:** The homepage built to the Design Plan, bilingual, fast — deferred-feature sections stubbed cleanly.

**Depends on:** Phases 3–4.

**Frontend (sections per Design Plan §10):**
1. Hero (eyebrow, headline, sub, **primary CTA "Book a Repair"**, device showcase, trust bar with animated counters).
2. Device grid (9 cards from `/api/catalog/categories/`, link to service pages; stagger reveal).
3. Why AppleLab (6 feature cards).
4. How It Works (4 steps, dark section).
5. Most Requested Repairs — **render statically/from seed without prices for MVP** (no instant-quote); CTA points to **Book a Repair** (not "Instant Quote") until Phase 21.
6. Repair Status tracker widget (wire in Phase 9; static demo until then).
7. Testimonials (from `/api/testimonials/`; seeded; carousel, dark section).
8. Corporate CTA — link to a simple contact/`mailto` for MVP (full page Phase 25).
9. Blog preview — **hidden** until blog exists (Phase 23).
10. Map + Contact (Google Maps embed from `SiteConfig`; NAP; WhatsApp button).
11. Footer (Phase 3).

- Rendering: ISR/SSG where possible; below-fold sections lazy-loaded; `next/image` for all imagery.

**Edge cases & validation**
- Sections gracefully **collapse when their data is empty** (no testimonials → hide; no blog → hide) — no empty shells.
- Hero "Instant Quote" secondary CTA from the PRD is **replaced** by a secondary like "Track your repair" or "Talk to us on WhatsApp" for MVP (no quote engine yet).
- Map embed respects CSP (§4.6) and cookie consent (Phase 18) — until consent, show a click-to-load placeholder.
- Counter animation runs once on view; respects reduced-motion.
- LCP image prioritized; CLS controlled (reserved media dimensions).

**DoD**
- [ ] Home renders all live sections in EN/BN; stubs hidden cleanly.
- [ ] Lighthouse mobile ≥ 90 on home (provisional); build/lint pass.

---

## Phase 6 — Service pages + FAQ + Warranty + About + Contact

**Goal:** Supporting public pages (SEO + trust), CMS-driven where applicable.

**Depends on:** Phases 4–5.

**Frontend / Backend**
- **Service pages** `/[locale]/services/[category-slug]` (SSG + ISR) from `ServicePage` + `Issue` (+ models): hero, common issues grid, repair process timeline, warranty badge, device-specific FAQ accordion, **"Book a Repair" CTA pre-selecting this category**. (Pricing table is **deferred** to Phase 21 — omit or show "Free diagnosis, then quote".)
- `GET /api/services/{category_slug}/` (bilingual) for service content.
- **FAQ** page (accordion grouped by category; `FAQPage` JSON-LD), **Warranty** page (policy content), **About** (story/mission/team/milestones/map), **Contact** (NAP, map, WhatsApp, simple contact form → email to owner, reuse honeypot + throttle).

**Edge cases & validation**
- Service page for a category with no `ServicePage` row → sensible default/generated content, not 404; or 404 + sitemap excludes it (decide and be consistent).
- Contact form: validation, success/error states, spam protection, double-submit guard, localized confirmation.
- Deep link `/services/[unknown-slug]` → 404 with helpful links.
- All pages bilingual with hreflang/canonical (full SEO in Phase 16).

**DoD**
- [ ] Service/FAQ/Warranty/About/Contact live in EN/BN; CMS content flows.
- [ ] Contact form emails owner; spam-protected; tests pass.

---

# PART III — REPAIR REQUEST (client asks 1–3)

## Phase 7 — Repair request backend (model, photos, create API, ticket ID, owner email)

**Goal:** Reliable intake persistence + owner notification — the heart of the product.

**Depends on:** Phase 4.

**Backend — models (`repairs/models.py`)**
- `RepairRequest`: `id` UUID; `ticket_id` (unique, generated §3.4); `category` FK (`core.DeviceCategory`, SET_NULL); `device_model` FK (`core.DeviceModel`, SET_NULL, nullable) **plus** `device_model_other` (CharField, for "not listed"); `issues` M2M (`core.Issue`); `issue_other` (CharField, for "Other"); `issue_description` (Text); `customer_name`, `customer_phone` (normalized + display), `customer_email` (blank ok); `lang_preference`; `status` (default `PENDING`); `public_note` (customer-visible), `internal_note` (staff-only); `assigned_staff` (FK `accounts.User` nullable or CharField); `customer` FK (`crm.Customer`, nullable — linked in Phase 10/12); `confirmation_token` (opaque, unguessable); timestamps.
- `RepairPhoto`: FK `RepairRequest`, `image` (ImageField, private storage), `created_at`. (Or `photos` JSON of media keys — prefer a model for per-file validation + cleanup.)
- `RepairStatusHistory`: FK request, `status`, `note`, `changed_by`, `created_at`.

**Backend — API**
- `POST /api/repairs/requests/` (multipart): validates device/issue selection, normalizes phone (§4.3), validates photos (count ≤3, ≤5MB each, image MIME sniff, allow HEIC/HEIF + JPEG/PNG/WebP), re-encodes/strips EXIF, generates ticket, writes initial status history, returns `{ ticket_id, confirmation_token, status }`.
- On success → **email the owner** (`SiteConfig.email`) with full details + thumbnail links; optional ack email to customer if email provided. Email failure must **not** fail the request (log + retry/queue).
- Throttle + honeypot/captcha.

**Edge cases & validation**
- **Ticket ID race** under concurrent submits → atomic generation, unique guaranteed (§3.4).
- **"Other" paths:** model not chosen but `device_model_other` filled; issue "Other" with `issue_other` text; require at least one of {issue selected, issue_other, description}.
- **HEIC** from iPhones (very common in BD) accepted and converted to a viewable format for admin thumbnails; corrupt/oversized/non-image rejected with clear messages; partial multi-file upload failure handled.
- Phone invalid/non-BD → clear error or override path; empty email allowed; XSS-safe text fields.
- Idempotency: a retried submit (network) shouldn't create duplicate tickets (idempotency key or client-side guard + server dedupe window).
- Category/model went inactive between page load and submit → still accept (capture snapshot of names) so historical requests render even if catalog changes.
- Strip/validate metadata; reject scripts in filenames; sanitize filenames.

**DoD**
- [ ] Create endpoint persists request + photos + history + ticket; owner email sent.
- [ ] All edge cases above covered by tests (race, HEIC, other-paths, throttling, validation).
- [ ] Photos stored privately; EXIF stripped.

---

## Phase 8 — Public repair request wizard (the centerpiece)

**Goal:** The easy, simple **product → year → model → issue (+Other) → details/photos → contact → review → confirm** flow.

**Depends on:** Phases 4, 7.

**Frontend (`/[locale]/booking` or `/repair-request`):** multi-step wizard, client state, single submit at the end.
1. **Category** — icon grid (from categories API). Preselect if arriving from a service page.
2. **Year** — chips/dropdown of distinct years for the category. Include **"I'm not sure / not listed."**
3. **Model** — list filtered by category+year; include **"My model isn't listed"** → reveals `device_model_other` text.
4. **Issue** — checkboxes from issues API (context-aware) + **"Other (not listed)"** → reveals `issue_other`; plus free-text `issue_description`; **photo upload** (≤3, ≤5MB, drag/drop, preview, remove, progress, client-side type/size check + HEIC notice).
5. **Contact** — name, phone (required, BD validation/format-as-you-type), email (optional), language preference (defaults to current locale).
6. **Review** — full summary; edit-any-step; **submit** (disabled while in-flight; prevents double submit).
7. **Confirmation** — ticket ID, next steps, **"Message us on WhatsApp"** deep link (prefilled with ticket + chosen language), link to status tracker (Phase 9). Reachable via `confirmation_token` URL.

**Edge cases & validation**
- **State persistence:** survive accidental refresh (sessionStorage); clear after success. Browser back/forward between steps preserves data; can't skip ahead past invalid steps.
- Category with **no years/models** → jump straight to "not listed" + description (don't dead-end).
- Per-step validation with inline errors; can't submit without device identity (model or "other") and at least one issue signal.
- Upload UX: oversize/too-many/unsupported handled before submit; failed upload retriable; HEIC preview fallback.
- Submit failures (network/500/throttled) show a recoverable error; on success the form is locked and the confirmation is shown; refreshing confirmation re-fetches by token (no resubmit).
- Fully bilingual incl. validation messages, WhatsApp prefilled text, and number formatting.
- Accessibility: each step is a labeled fieldset; focus moves to step heading on change; errors announced.
- Analytics `Lead` event hook point (wired in Phase 17).

**DoD**
- [ ] End-to-end submit creates a request, returns ticket, shows confirmation + WhatsApp link, in EN/BN.
- [ ] "Other/not listed" works at both model and issue levels.
- [ ] State persistence, double-submit guard, upload edge cases verified; interaction tests pass.

---

## Phase 9 — Public repair status tracker

**Goal:** Anonymous status lookup (complements owner responses).

**Depends on:** Phases 7–8.

**Backend**
- `GET /api/repairs/status/?ticket={id}&phone_last4={xxxx}` — match ticket + last 4 of normalized phone; return status + **public** timeline (status + timestamp + `public_note` only), **never** internal notes/photos/PII. Rate-limit 10/min/IP (Redis).

**Frontend**
- `/[locale]/repair-status` page + the homepage widget (Phase 5): inputs, localized status timeline with `--status-*` colors, friendly not-found state.

**Edge cases & validation**
- Wrong phone vs unknown ticket → **same generic "not found"** message (no enumeration/leak).
- Rate-limit exceeded → clear retry-later message.
- Cancelled/No-Fix/Completed render terminal states correctly; timeline order stable.
- Locale-correct status labels and dates.

**DoD**
- [ ] Lookup works; only safe fields exposed; enumeration-safe; rate-limited; bilingual.
- [ ] Tests: match/no-match/wrong-phone/rate-limit.

---

# PART IV — ADMIN & WORKFLOW (client asks 3–4)

## Phase 10 — Admin: repair request queue & detail

**Goal:** Owner sees the request list and can **respond + WhatsApp** the customer from the system.

**Depends on:** Phases 7–9; reuses the custom admin shell (§2.2).

**Backend (`/api/admin/...`, staff-only)**
- `GET /api/admin/repair-requests/` — paginated list; filters: status, category, date range, assigned staff, search (ticket/name/phone); sort by created/updated.
- `GET /api/admin/repair-requests/{id}/` — full detail incl. private photos (admin-auth media) + history + linked customer/invoice.
- `PATCH /api/admin/repair-requests/{id}/` — update status (validated transition), `internal_note`, `public_note`, `assigned_staff`; writing status appends history (`changed_by` = staff) and optionally triggers customer notification (Phase 11).
- Endpoint to get a **WhatsApp deep link** (or build client-side) with a localized prefilled message (ticket + status).

**Frontend (`src/app/admin/repair-requests`, `src/views/admin/*`)**
- `AdminRepairRequests` — table (`@tanstack/react-table`): ticket, customer, device, issues, status chip, age, assignee; filters/search/pagination; row → detail.
- `AdminRepairRequestDetail` — all fields, **photo gallery/lightbox**, status changer with note, internal/staff notes, history timeline, **"WhatsApp customer"** button (opens `wa.me` prefilled), **"Create invoice from this request"** (Phase 12/14), link/create `Customer`.
- Add nav entries to `AdminLayout`.

**Edge cases & validation**
- Invalid status transitions blocked (define allowed graph; allow staff override with confirmation + log).
- **WhatsApp:** missing/invalid phone → button disabled with reason; message URL-encoded + length-safe; opens in new tab.
- Concurrent edits by two staff → optimistic concurrency or last-write-wins with a visible "updated by X" stamp.
- Photo access is staff-authenticated (no public leak); large galleries paginate; broken/converted images handled.
- Large queues paginate; filters combine; empty/zero states.
- Permission: non-staff → 403; admin gate respected.

**DoD**
- [ ] Owner can list, filter, open, update status/notes, view photos, and WhatsApp the customer.
- [ ] Status changes recorded in history; transitions validated; permissions enforced.
- [ ] Tests for list filters, detail, patch/transitions, permissions, WhatsApp link building.

---

## Phase 11 — Notifications (customer status updates)

**Goal:** Keep customers informed on status changes (email at MVP; SMS deferred).

**Depends on:** Phase 10.

**Backend**
- On status change (and configurable per status), send a localized email to the customer (`lang_preference`) using the existing email pattern; include ticket, new status, public note, status-tracker link, WhatsApp link.
- Templates EN + BN; async via Celery if available, else sync with failure logging + admin-visible "last notification" state.
- A "resend notification" admin action; a toggle to suppress notifications for a given change.

**Edge cases & validation**
- No customer email → skip silently (offer WhatsApp instead); never error.
- Email send failure → logged, retriable, doesn't block the status update.
- Avoid duplicate/spammy emails on rapid successive changes (debounce or only on meaningful transitions).
- Bengali email renders with correct font/encoding; links locale-correct.

**DoD**
- [ ] Status changes optionally notify the customer in their language; failures are safe.
- [ ] Templates bilingual; resend + suppress work; tests cover no-email/failure paths.

---

# PART V — CRM & FINANCE

## Phase 12 — CRM backend (Customer, Invoice, InvoiceItem, Payment)

**Goal:** The finance data model — correct, server-authoritative, concurrency-safe.

**Depends on:** Phase 7 (to link requests).

**Backend — models (`crm/models.py`)**
- `Customer`: `name`, `phone` (normalized, indexed — the dedupe key), `display_phone`, `email`, `address`, `notes`, `created_at`. Auto-link/create from a `RepairRequest` by normalized phone.
- `Invoice`: `invoice_number` (unique §3.4), `customer` FK, `repair_request` FK (nullable), `issue_date`, `due_date`, `status` (§4.2), `currency='BDT'`, `discount_amount`, `discount_percent` (choose amount-based primary; percent optional), `tax_amount` (default 0), `subtotal`/`total` (**computed server-side**), `notes`, `customer_lang` (for invoice language), timestamps.
- `InvoiceItem`: `invoice` FK, `description`, `quantity` (>0), `unit_price` (≥0), `line_total` (computed), `display_order`.
- `Payment`: `invoice` FK, `amount` (>0), `method` (cash/bkash/card/bank/other), `reference`, `paid_at`, `recorded_by`, `note`.

**Backend — APIs (`/api/admin/...`, staff-only)**
- Customers: list/search/create/detail/update; merge-duplicates action.
- Invoices: list (filters: status, customer, date, overdue), create (with nested line items), detail, update, cancel; recompute totals server-side on every write.
- Payments: add/list/void; on payment change, **recompute invoice status** (§4.2).
- `GET /api/admin/finance/summary/` — outstanding total, received this month, unpaid/overdue counts (Phase 15).

**Edge cases & validation**
- **Totals always recomputed on the server**; client-sent totals ignored. `line_total = qty*unit_price`; `subtotal = Σ line_total`; `total = subtotal − discount + tax` (never negative; clamp/validate).
- **Invoice number race** → atomic (§3.4).
- **Editing after payment:** block lowering `total` below `paid_total`, or warn + require confirmation; cancelling a partially-paid invoice requires explicit confirmation and keeps payment records.
- **Overpayment / partial / multiple payments** handled; status transitions correct; voiding a payment recalculates status.
- Customer dedupe: same normalized phone → reuse; different name on same phone → keep latest/flag, don't silently overwrite; provide merge.
- Decimal rounding consistent (2dp, half-up); no float drift.
- Deleting an invoice/line with payments prevented (or soft-delete + audit).
- Permissions: staff only; optionally restrict who can void payments/cancel invoices (owner vs technician — see note in §2; boilerplate has `is_superuser`).

**DoD**
- [ ] Models + APIs; server-authoritative totals; concurrency-safe numbering.
- [ ] Payment/status recomputation correct across partial/over/void.
- [ ] Edit-after-payment + dedupe + rounding covered by tests.

---

## Phase 13 — Admin: customers

**Goal:** Very simple customer management.

**Depends on:** Phase 12.

**Frontend (`src/app/admin/customers`)**
- `AdminCustomers` — searchable/paginated table (name, phone, email, # requests, # invoices, outstanding balance).
- `AdminCustomerDetail` — profile + edit, **repair request history**, **invoice history with balances**, quick actions: WhatsApp, new invoice, merge duplicate.

**Edge cases & validation**
- Search by partial phone/name/email; normalized-phone search matches all formats.
- Merge duplicates updates linked requests/invoices atomically.
- Empty states; deleting a customer with invoices prevented/soft-deleted.

**DoD**
- [ ] Customer list/detail/edit/merge; histories + balances shown; tests pass.

---

## Phase 14 — Admin: invoice split editor (A5 live preview) + list + PDF

**Goal:** The requested **left fields / right live A5 preview** invoice editor, with PDF/print output.

**Depends on:** Phases 12–13.

**Frontend (`src/app/admin/invoices`)**
- `AdminInvoices` — list with filters (status, overdue, customer, date), totals/outstanding badges, "New invoice".
- `AdminInvoiceEditor` — **two-pane layout:**
  - **Left:** customer (search/select/create), repair-request link (prefills line items from device + issues), line items (add/remove/reorder; description/qty/unit price), discount, tax (optional), issue/due dates, status, notes, invoice language (EN/BN).
  - **Right:** **live invoice preview at A5 portrait (148×210mm)**, branded (logo + brand gradient accents), updating as you type, in the selected language.
- **Output:** print/PDF via an A5 print stylesheet (`@page { size: A5; margin: … }`) → browser print-to-PDF for MVP (filename = invoice number). Server-side HTML→PDF can replace later for pixel-consistency.
- `AdminInvoiceDetail` — view invoice, **record payment(s)**, payment history, status, resend/share, WhatsApp the customer a payment link/summary.

**Edge cases & validation**
- **Multi-page A5:** many line items paginate cleanly across A5 pages (repeat header, page numbers, no row clipping).
- Totals shown in preview come from **server compute** (or a shared pure function mirrored exactly) — preview must match the saved/PDF total.
- Long descriptions/Bengali text wrap correctly; ৳ and digits render; amount-in-words optional (defer if risky).
- Editing after payment respects Phase 12 rules (warn/lock).
- Print fidelity: A5 size correct across Chrome/Safari/Firefox; fonts (incl. Bengali) embedded/available; logo crisp.
- Autosave/draft vs explicit save; unsaved-changes guard; concurrent edit handling.
- Empty invoice (no items) can't be finalized; zero/negative totals prevented.

**DoD**
- [ ] Split editor with live A5 preview; create/edit/cancel; line items + discount/tax.
- [ ] A5 PDF/print correct (single + multi-page) in EN/BN; totals match server.
- [ ] Record/void payments; status auto-updates; tests + manual print QA done.

---

## Phase 15 — Admin: payments & finance dashboard

**Goal:** The finance overview the owner cares about.

**Depends on:** Phase 14; reuses `AdminDashboard` + `recharts`.

**Frontend / Backend**
- Extend `/api/admin/finance/summary/`: outstanding balance, received this/last month, unpaid + overdue counts, revenue trend (by month), top customers.
- `AdminDashboard` finance widgets (cards + charts) **plus** repair stats (requests today/week/month, by status, by device) from a repairs summary endpoint.
- Payments list/export (CSV) — reuse the `AdminPaymentsExportView` export pattern.

**Edge cases & validation**
- All money in Dhaka time windows; "overdue" = `due_date < today` and not paid.
- Empty/zero data renders friendly charts; large numbers formatted (lakh/crore optional).
- Export respects filters; no PII leakage beyond staff scope.

**DoD**
- [ ] Finance + repair dashboard live; summary endpoint tested; export works.

---

# PART VI — HARDENING & LAUNCH

## Phase 16 — SEO & structured data

**Goal:** Indexable, bilingual, rich-result-ready.

**Depends on:** Phases 5–9.

**Frontend**
- Per-page bilingual metadata (title/description/canonical/OG/twitter); `hreflang` en/bn/x-default on every public page.
- Dynamic `sitemap.xml` (both locales: home, services, static pages; later blog) + `robots.txt` (disallow `/admin`, `/api`).
- JSON-LD: `LocalBusiness` (from `SiteConfig`, with geo/hours/priceRange), `Service` per service page, `FAQPage`, `BreadcrumbList`.
- `next/image` everywhere with explicit dimensions + alt from CMS.

**Edge cases & validation**
- Canonical points to the correct locale; no duplicate-content penalties; `x-default` set.
- Sitemap excludes noindex/admin; valid XML; updates as content changes.
- JSON-LD validates (Rich Results test); NAP matches `SiteConfig` exactly.

**DoD**
- [ ] Metadata/hreflang/sitemap/robots/JSON-LD shipped and validated in both locales.

---

## Phase 17 — Analytics & Pixel (optional, can defer)

**Goal:** GA4/GTM + Meta Pixel (client-side) with consent + CSP.

**Depends on:** Phases 5–8, 18 (consent).

**Frontend**
- GTM/GA4 + Meta Pixel loaded **only after consent** (Phase 18); IDs from `SiteConfig`.
- `dataLayer` helper (PRD §11.3); events: PageView, ViewContent (service), **Lead** (repair request submitted), Contact, Search (later quote). Server-side **Meta CAPI is Post-MVP (Phase 27)**.
- Update CSP (§4.6).

**Edge cases & validation**
- No tracking before consent; respects opt-out; no console/CSP violations.
- Events fire once; no PII in client events.

**DoD**
- [ ] Consent-gated analytics + key events; CSP updated; no violations.

---

## Phase 18 — Security, privacy, rate-limiting, file hardening, cookie consent

**Goal:** Production-grade safety and BD privacy basics.

**Depends on:** Phases 7–14.

**Backend / Frontend**
- Rate-limit + honeypot/captcha on **all** public POSTs (repair request, contact); status lookup rate-limited.
- File-upload hardening: MIME sniff (not just extension), size/count caps, image re-encode + EXIF strip, filename sanitization, private serving; optional ClamAV.
- CORS/ALLOWED_HOSTS for the real domain; admin IP allowlist optional (`ADMIN_ALLOWED_IPS`); HTTPS/HSTS in prod; keep CSP tight + only the deltas you shipped.
- Cookie consent banner (opt-in analytics), Privacy Policy + Terms pages (footer-linked), no PII in URLs.
- Confirm customer photos + invoices are **staff-only**; no enumeration on public endpoints.

**Edge cases & validation**
- Throttle responses are friendly; captcha doesn't block legitimate mobile users.
- Consent persists; declining disables analytics + map auto-load.
- Pen-test the public POSTs (spam, oversized files, script-in-field, IDOR on media/tickets/invoices).

**DoD**
- [ ] All public inputs rate-limited + spam-protected + validated.
- [ ] Consent + privacy pages live; media/invoice access staff-only; IDOR-safe.

---

## Phase 19 — QA, accessibility, performance, bilingual review

**Goal:** Cross-cutting polish before launch.

**Depends on:** all prior MVP phases.

- Full **bilingual QA**: every page/flow/email/invoice in EN **and** BN; Bengali font everywhere; no untranslated keys; date/number/currency correct.
- **Accessibility:** keyboard nav, focus order, labels, contrast (incl. dark sections), reduced-motion, screen-reader pass on wizard + invoice editor.
- **Performance:** Lighthouse mobile ≥ 90; LCP < 2.5s, CLS < 0.1, INP < 200ms; image/font optimization; lazy-load below-fold; bundle check.
- Finalize seed/fixtures; smoke-test the full journey: catalog → request → owner email → admin respond → WhatsApp → invoice → payment → dashboard.

**DoD**
- [ ] Both locales fully QA'd; a11y + perf targets met; end-to-end journey passes from a clean DB.

---

## Phase 20 — Deployment, infra, monitoring & handoff

**Goal:** Live, observable, client-trainable.

**Depends on:** Phase 19.

- Single-origin deploy (Next serves site + proxies `/api`,`/media` to Django) on the VPS per boilerplate, behind Nginx/Caddy + Cloudflare; Postgres + Redis; Celery worker/beat if used; Gunicorn; PM2/Docker for Next.
- Env: real values for DB, email (SMTP prod), `SiteConfig` IDs, WhatsApp, domain; `DEBUG=False`; `ALLOWED_HOSTS`/CORS set; media volume + backup; `collectstatic` + `migrate` on deploy.
- Monitoring: Sentry (errors), UptimeRobot; logging for emails/uploads/payments.
- **Client handoff:** admin training (manage catalog, requests, customers, invoices, site config, FAQ/testimonials), short runbook, Search Console submission.

**Edge cases & validation**
- Media persists across deploys; emails deliver from prod (SPF/DKIM); backups verified by a test restore.
- Rollback path documented; first-deploy migration order safe.

**DoD**
- [ ] Production live on the domain; monitoring on; backups + rollback verified; client trained; Search Console submitted.

---

# PART VII — POST-MVP (fully specced; build when ready)

> These are deferred per the MVP decision but specced so the coding agent can execute them later without re-scoping. Each still needs its own edge-case + DoD pass.

## Phase 21 — Instant Quote engine + pricing tables
- `RepairPrice` (`core`): `device_model` × `issue` → `price_min/max`, `turnaround_hours`, bilingual notes, `is_active`. Cascading public API; `/quote` page (category → model → issue → range + disclaimer "varies after diagnosis"); add price preview to service pages + "Most Requested Repairs". Pre-fill the repair wizard from a quote. **Edges:** missing price combos, ranges, never show price without model+issue, locale formatting, admin bulk price editing.

## Phase 22 — AI chat support agent (Anthropic)
- `chat` app (`ChatSession`, `ChatMessage`); `POST /api/chat/message/` SSE streaming; floating widget (Design §5.9); system prompt (PRD §12.2); sliding-window context; rate-limit 20/session/hr; WhatsApp human-handoff; reuse `SiteSettings.ai_provider/model`. **Edges:** never invent prices (route to quote), bilingual replies, abuse/rate-limit, PII handling, graceful API failure.

## Phase 23 — Blog / knowledge base
- `blog` app (`Category`, `Post`, bilingual, Markdown); list/detail/category/search (pg_trgm); `Article` JSON-LD; unhide homepage blog preview; admin authoring. **Edges:** draft/publish, slugs, empty search, reading-time, social share, sitemap inclusion.

## Phase 24 — Trade-in / Sell Your Mac
- `TradeInRequest` (`repairs` or `crm`): model/year/condition/serial/contact; public form (`/sell-your-mac`); admin valuation + notify; accept/decline link. **Edges:** spam, manual valuation workflow, status lifecycle, notifications.

## Phase 25 — Corporate services + inquiry
- `CorporateInquiry`: company/contact/device-count/requirements; `/corporate-services` page + form; admin pipeline (new→contacted→proposal→closed). **Edges:** B2B validation, internal notes, notifications.

## Phase 26 — Online booking deposits (bKash) + slots/capacity
- Reuse `subscriptions/bkash_service.py`; optional ৳500 deposit holds a slot; `BookingSlot` capacity; `InitiateCheckout`/`Purchase` events. **Edges:** payment callback/idempotency, slot capacity races, refund/cancel, no-card-data, reconciliation with invoices.

## Phase 27 — Meta CAPI (server-side) + SMS
- `analytics` app (`MetaCAPIEvent`); Celery flush (PRD §11.4) with SHA-256 hashed PII + Pixel dedup; SMS provider (Infobip/Twilio) for status updates. **Edges:** never store raw PII, dedup with client Pixel, retry/failure queue, BD SMS sender-ID rules, opt-out.

---

# Appendices

## Appendix A — Device catalog seed (guideline; agent fills realistic model+year coverage)

| Category (slug) | Representative models (with release year) |
|---|---|
| `iphone` | iPhone 8/X (2017), XR/XS (2018), 11 (2019), 12 (2020), 13 (2021), 14/14 Pro (2022), 15/15 Pro (2023), 16 line (2024), SE gens |
| `macbook-pro` | 13"/15"/16" Intel (2017–2019), 13" M1 (2020), 14"/16" M1 Pro/Max (2021), M2 (2022–2023), M3 (2023), M4 (2024) |
| `macbook-air` | 13" Intel (2017–2019), M1 (2020), M2 13"/15" (2022–2023), M3 (2024) |
| `ipad` | iPad 6th–10th gen, Air 3–6, mini 5–7, Pro 11"/12.9" (2018–2024) |
| `imac` | 21.5"/27" Intel (2017–2020), 24" M1 (2021), M3 (2023) |
| `mac-mini` | 2018 Intel, M1 (2020), M2 (2023), M4 (2024) |
| `mac-studio` | M1 Max/Ultra (2022), M2 (2023) |
| `apple-watch` | Series 3–10, SE 1–2, Ultra 1–2 |
| `airpods` | AirPods 1–4, Pro 1–2, Max |

Make `seed_catalog` idempotent; include `name_bn` (transliterated/translated) for each; mark `is_active`.

## Appendix B — Issues per category (from PRD §4.2.2)

MacBook Pro/Air: Screen, Battery, Keyboard, Trackpad, Logic Board, Water Damage, Charging Port, SSD/RAM Upgrade, Fan · iPhone: Screen (OLED/LCD), Battery, Back Glass, Charging Port, Camera, Speaker, Face ID · iPad: Screen/Digitizer, Battery, Charging Port, Speaker, Water Damage, Home Button · iMac: Screen, Logic Board, RAM/SSD Upgrade, Fan, Power Supply · Mac Mini: SSD/RAM Upgrade, Thermal Paste, Power · Mac Studio: Fan, SSD, Connectivity, Power · Apple Watch: Screen, Battery, Crown, Band Connector, Water Damage · AirPods: Charging Case, Earbud Replacement, Connectivity. **Every category also offers "Other (not listed)" via free text in the form.**

## Appendix C — Status & color reference
Repair: `PENDING/CONFIRMED/DIAGNOSED/IN_PROGRESS/READY/COMPLETED/CANCELLED/NO_FIX` → Design Plan §2.6 `--status-*`. Invoice: `draft/sent/partially_paid/paid/cancelled`.

## Appendix D — Env var delta (vs boilerplate `.env`)
Add/confirm: `DEFAULT_FROM_EMAIL`, prod SMTP; `NEXT_PUBLIC_WHATSAPP_NUMBER=8801603710044`; analytics IDs live in `SiteConfig` (DB), not env, where possible; **defer** `ANTHROPIC_API_KEY` (P22), `META_*` (P27), `SMS_*` (P27), `BKASH_*` (P26), S3/`AWS_*` (until remote media). Keep existing JWT/DB/Redis vars.

## Appendix E — Definition of Done (global, every phase)
- [ ] Feature works in **EN and BN** (where public) and English (admin).
- [ ] Migrations apply cleanly on a fresh DB; `seed_*` still works.
- [ ] Backend tests (validation/permissions/edge) + relevant frontend tests written and green.
- [ ] `npm run build` + lint pass; no new CSP/console errors.
- [ ] Existing auth + admin shell still function (no regression).
- [ ] Money is Decimal + server-computed; IDs concurrency-safe; PII/media access-controlled.
- [ ] Manual QA checklist for the phase completed in both locales.

---

*Companion build plan to AppleLab_PRD.md. Build top-to-bottom; Part VII is post-launch. Keep this file updated as phases land.*
