# KRAITIN — The AI Cofounder That Tells You What To Build

> **Full-stack AI SaaS platform** — React + TypeScript + Supabase + Stripe  
> Discovers real startup opportunities, runs AI market research, generates launch plans, and includes a full support chat system.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [What's Built](#2-whats-built)
3. [What's Left — Roadmap](#3-whats-left--roadmap)
4. [Production Readiness Checklist](#4-production-readiness-checklist)
5. [Tech Stack](#5-tech-stack)
6. [Repository Structure](#6-repository-structure)
7. [Feature Reference](#7-feature-reference)
8. [Local Development Setup](#8-local-development-setup)
9. [Environment Variables](#9-environment-variables)
10. [Supabase Setup](#10-supabase-setup)
11. [Edge Functions](#11-edge-functions)
12. [Stripe Payments Setup](#12-stripe-payments-setup)
13. [Resend Email Setup](#13-resend-email-setup)
14. [Database Schema](#14-database-schema)
15. [Deploying to Production](#15-deploying-to-production)
16. [Continuing Development](#16-continuing-development)
17. [Common Issues & Fixes](#17-common-issues--fixes)

---

## 1. Project Overview

KRAITIN is an AI-powered startup co-founder platform that helps founders:

- **Discover** real, scored startup opportunities across 8 market categories
- **Research** any idea deeply using Gemini 2.5 Flash with real-time web grounding
- **Plan launches** with AI-generated go-to-market strategies
- **Build MVPs** with structured roadmaps and feature prioritisation
- **Stay informed** with curated startup and tech news
- **Save & track** opportunities in a personal watchlist
- **Chat with Kira** — an AI support agent that emails conversation transcripts to you

The platform uses a dark, minimal design system and is subscription-gated via Stripe (Free / Pro / Growth tiers).

---

## 2. What's Built

This section documents every completed feature, integration, and infrastructure piece as of the current version.

### ✅ Frontend — Pages & UI

| Page / Component | Route | Status |
|---|---|---|
| Landing page with hero, features, pricing, FAQ | `/` | ✅ Complete |
| Login / Registration | `/login` | ✅ Complete |
| Dashboard home with stats and quick actions | `/dashboard` | ✅ Complete |
| Opportunity Discovery — 338 seeded opportunities | `/opportunities` | ✅ Complete |
| Research Agent — streaming AI market research | `/research` | ✅ Complete |
| Launch Agent — streaming AI GTM strategy | `/launch-agent` | ✅ Complete |
| MVP Planner — streaming AI build roadmap | `/mvp-planner` | ✅ Complete |
| News Intelligence — curated startup news | `/news` | ✅ Complete |
| Reports — saved AI outputs, searchable | `/reports` | ✅ Complete |
| Watchlist — saved opportunities | `/watchlist` | ✅ Complete |
| Billing — Stripe subscription management | `/billing` | ✅ Complete |
| Settings — profile, preferences | `/settings` | ✅ Complete |
| Kira — floating AI support chat widget | All auth pages | ✅ Complete |
| Paywall modal — upgrade prompt on locked features | Global | ✅ Complete |
| Notification bell — in-app notifications | Header | ✅ Complete |
| Upgrade banner — contextual upsell strip | Dashboard | ✅ Complete |
| Responsive sidebar + mobile hamburger nav | All auth pages | ✅ Complete |
| Dark design system with `#C5FF00` lime accent | Global | ✅ Complete |

### ✅ Backend — Edge Functions

| Function | Purpose | Status |
|---|---|---|
| `ai-search` | Streams Gemini 2.5 Flash responses via SSE (Research, Launch, MVP agents) | ✅ Complete |
| `all-news` | Fetches news from The News API (subscription-gated, rate-limited) | ✅ Complete |
| `create-checkout` | Creates Stripe Checkout session for upgrades | ✅ Complete |
| `export-report` | Generates downloadable Markdown report from saved content | ✅ Complete |
| `refresh-opportunities` | Calls Gemini to generate fresh AI-researched opportunities and writes to DB | ✅ Complete |
| `stripe-portal` | Creates Stripe Customer Portal session for subscription management | ✅ Complete |
| `stripe-webhook` | Handles Stripe payment events, updates `subscriptions` table | ✅ Complete |
| `support-chat` | AI support chat (Kira) + emails transcript via Resend | ✅ Complete |

### ✅ Database — Tables & Schema

| Table | Purpose | Status |
|---|---|---|
| `profiles` | User profile, subscription tier, Stripe customer ID | ✅ Complete |
| `opportunities` | 338 seeded startup opportunities across 8 categories | ✅ Complete |
| `watchlist` | User-saved opportunities | ✅ Complete |
| `reports` | Saved AI research and launch reports | ✅ Complete |
| `notifications` | In-app notification feed | ✅ Complete |
| `subscriptions` | Stripe subscription state (status, period, price) | ✅ Complete |
| `paywall_events` | Rate-limiting and paywall event log | ✅ Complete |
| `support_conversations` | Kira chat sessions | ✅ Complete |
| `support_messages` | Individual Kira chat messages | ✅ Complete |
| `founder_profiles` | Extended founder profile (bio, goals, stage) | ✅ Complete |
| `affiliate_referrals` | Affiliate / referral tracking | ✅ Complete |

All tables have RLS enabled with per-user read/write policies.

### ✅ Opportunity Data — Seeded Categories

| Category | Opportunities | Notes |
|---|---|---|
| AI | 15 | Initial seed |
| B2B SaaS | 98 | Largest seeded category |
| Consumer | 31 | |
| Education | 19 | |
| Finance | 73 | 23 initial + 50 AI-researched additions (v51) |
| Health | 73 | 23 initial + 50 AI-researched additions (v52) |
| Mobile Apps | 15 | |
| Productivity | 14 | |
| **Total** | **338** | |

### ✅ Integrations

| Integration | Purpose | Status |
|---|---|---|
| Google Gemini 2.5 Flash (direct API) | AI for research, launch, MVP, opportunities, support | ✅ Live |
| Stripe Checkout + Portal + Webhooks | Subscription billing | ✅ Live |
| The News API (direct API) | News intelligence feed | ✅ Live |
| Resend | Support transcript emails | ✅ Live |
| Supabase Auth (email/password) | Authentication | ✅ Live |

### ✅ Infrastructure

- CORS origin allowlisting on all edge functions
- JWT auth verification on every protected edge function
- Subscription status gating (active/trialing required for premium features)
- Rate limiting on `all-news` (60 requests/user/hour via `paywall_events` table)
- `GEMINI_API_KEY` and `THE_NEWS_API_KEY` stored as Supabase secrets (no platform gateway dependency)
- Full local deployment package: `.env.example`, migration SQL, README

---

## 3. What's Left — Roadmap

These are the features and improvements needed to take KRAITIN from its current state to a fully polished, production-ready product.

### 🔴 Critical — Required Before Any Public Launch

| Item | Why It Matters | Effort |
|---|---|---|
| **Custom email domain for Resend** | `onboarding@resend.dev` triggers spam filters; use `hello@kraitin.app` | Low |
| **Stripe test → live key swap** | Currently may be using test keys; real billing requires live keys | Low |
| **Set `ALLOWED_ORIGINS` to production domain** | Without this, CORS blocks all edge function calls from prod | Low |
| **Supabase project on paid plan** | Free tier pauses after 1 week inactivity; unacceptable for prod | Low |
| **Custom domain on frontend host** | `vercel.app` subdomain looks unprofessional at launch | Low |
| **Supabase Auth redirect URLs updated** | Must match production domain or email confirmation links break | Low |
| **Error monitoring (Sentry or LogRocket)** | No visibility into runtime errors without this | Medium |

### 🟡 High Priority — Significantly Improves Product Quality

| Item | Why It Matters | Effort |
|---|---|---|
| **Opportunity search & filters persist in URL** | Deep linking to filtered views; better UX; shareable URLs | Low |
| **Seed remaining categories to 50+ each** | AI, Education, Mobile Apps, Productivity each have <20 entries | Medium |
| **Affiliate dashboard UI** | `affiliate_referrals` table exists but no UI for referrers to see stats | Medium |
| **Password reset flow** | Currently no "Forgot password?" link on the login page | Low |
| **Email verification on signup** | Supabase sends verification emails but no UI confirms this to user | Low |
| **Onboarding flow for new users** | Zero-state experience is abrupt; guide users to first AI search | Medium |
| **Opportunity refresh feedback** | No clear loading state or success toast after category refresh | Low |
| **Kira chat: message history on re-open** | Closing and reopening chat loses context visually | Low |
| **Report download format options** | Currently only Markdown; add PDF and HTML export | Medium |
| **Social proof on landing page** | Testimonials, user count, or "as seen in" boosts conversion | Low |
| **SEO meta tags** | Landing page has no `<meta description>` or OG tags | Low |

### 🟢 Growth & Monetisation

| Item | Why It Matters | Effort |
|---|---|---|
| **Annual pricing in Stripe + UI** | Annual plans reduce churn and increase LTV; table exists, prices needed | Medium |
| **Usage analytics dashboard** | Track which agents are used most; inform product decisions | High |
| **Team / workspace accounts** | Multi-seat B2B plan; major revenue unlock | High |
| **Saved searches / opportunity alerts** | Email user when new opportunities match their saved filters | High |
| **AI-generated opportunity comparison** | Side-by-side compare two opportunities with Gemini analysis | Medium |
| **Affiliate referral UI** | Complete the referral loop: share link → track signups → reward | Medium |
| **Mobile app (React Native / Expo)** | Core agents work well on mobile; significant addressable market | High |
| **Chrome extension** | Research any URL/idea inline without opening the app | High |
| **API access tier** | Allow developers to query opportunities and run agents programmatically | High |
| **White-label / agency plan** | Agencies building for clients need a reseller tier | High |

### 🔵 Technical Debt & Code Quality

| Item | Notes | Effort |
|---|---|---|
| **Unit tests for edge functions** | Zero test coverage today; at minimum test webhook handler and auth | Medium |
| **E2E tests (Playwright)** | Cover signup → upgrade → agent run flow | High |
| **Edge function shared utilities** | `corsHeaders` and `errJson` are copy-pasted across 8 functions; extract to shared module | Low |
| **Opportunity category enum in DB** | `category` is a free-text string; add a CHECK constraint or FK | Low |
| **Pagination on `/opportunities`** | 338 rows rendered at once; add cursor-based pagination | Medium |
| **Streaming error recovery in UI** | SSE errors surface as silent failures; show user-friendly retry prompt | Low |
| **Retry logic on Gemini API calls** | No retry on transient 429/503 errors from Google AI | Low |

---

## 4. Production Readiness Checklist

Work through this list before opening to paying users. Items are ordered by dependency.

### Infrastructure

- [ ] Upgrade Supabase project to **Pro plan** ($25/mo) — prevents auto-pause
- [ ] Set `ALLOWED_ORIGINS` secret to production domain: `supabase secrets set ALLOWED_ORIGINS="https://yourdomain.com"`
- [ ] Redeploy all 8 edge functions after updating secrets
- [ ] Enable **Point-in-Time Recovery** on Supabase (Pro plan feature)
- [ ] Set up **Supabase database backups** (Dashboard → Database → Backups)

### Domain & SSL

- [ ] Register domain (e.g. `kraitin.app`)
- [ ] Connect domain to Vercel / Netlify deployment
- [ ] SSL certificate auto-provisioned by Vercel/Netlify
- [ ] Update Supabase Auth: **Site URL** and **Redirect URLs** to production domain
- [ ] Update `ALLOWED_ORIGINS` secret with final domain

### Authentication

- [ ] Confirm Supabase email confirmation is enabled (Auth → Providers → Email)
- [ ] Customise confirmation email templates (Auth → Email Templates)
- [ ] Test full auth flow: signup → confirm → login → logout
- [ ] Implement password reset UI (link on `/login` page)
- [ ] Set sensible session expiry in Supabase Auth settings

### Billing

- [ ] Activate Stripe account and complete business verification
- [ ] Swap test keys for **live keys**: `STRIPE_SECRET_KEY=sk_live_...`
- [ ] Create Pro and Growth products in Stripe live mode with correct prices
- [ ] Update `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_YEARLY_PRICE_ID` to live price IDs
- [ ] Register live webhook endpoint in Stripe Dashboard: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
- [ ] Update `STRIPE_WEBHOOK_SECRET` with live signing secret
- [ ] Test full payment flow: upgrade → webhook fires → subscription active → feature unlocked
- [ ] Enable Stripe Radar for fraud detection (Dashboard → Radar)
- [ ] Set up Stripe email receipts for customers

### Email

- [ ] Add and verify custom domain in Resend (e.g. `kraitin.app`)
- [ ] Update `from` address in `support-chat/index.ts` to `support@kraitin.app`
- [ ] Update support email recipient from placeholder to your operational inbox
- [ ] Redeploy `support-chat` function after changes
- [ ] Send a test support chat and confirm email arrives

### API Keys & Secrets

- [ ] Set `GEMINI_API_KEY` in Supabase secrets (Google AI Studio: [aistudio.google.com/apikey](https://aistudio.google.com/apikey))
- [ ] Set `THE_NEWS_API_KEY` in Supabase secrets ([thenewsapi.com](https://www.thenewsapi.com))
- [ ] Set `RESEND_API_KEY` in Supabase secrets
- [ ] Set `STRIPE_SECRET_KEY` (live) in Supabase secrets
- [ ] Set `STRIPE_WEBHOOK_SECRET` (live) in Supabase secrets
- [ ] Set `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_YEARLY_PRICE_ID` in Supabase secrets
- [ ] Rotate all secrets if they were ever accidentally committed to Git
- [ ] Confirm `.env.local` is in `.gitignore` and never committed

### Monitoring & Observability

- [ ] Set up **Sentry** (or LogRocket) for frontend error tracking — add DSN to `VITE_SENTRY_DSN`
- [ ] Add `Sentry.init()` in `src/main.tsx`
- [ ] Set up **Supabase Log Drain** or edge function structured logging
- [ ] Create **uptime monitor** (UptimeRobot / Better Uptime) for the production URL
- [ ] Set up **Stripe Dashboard email alerts** for failed payments and chargebacks
- [ ] Add Google Analytics or Plausible for product usage metrics

### Security

- [ ] Run `pnpm audit` and resolve any high-severity npm vulnerabilities
- [ ] Confirm no `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` is ever exposed to the frontend
- [ ] Verify all Supabase RLS policies: no table should be unprotected
- [ ] Add `Content-Security-Policy` header via Vercel/Netlify config
- [ ] Enable Supabase **Auth → Leaked Password Protection**
- [ ] Set Stripe webhook to verify `Stripe-Signature` header (already in `stripe-webhook` function — confirm it's working)
- [ ] Rate-limit the auth endpoint in Supabase (Auth → Rate Limits)

### Performance

- [ ] Run `pnpm build` and check bundle size — aim for initial JS < 300kb gzipped
- [ ] Add `loading="lazy"` to all images
- [ ] Add pagination to `/opportunities` page (currently renders 338 rows at once)
- [ ] Enable Vercel Edge Network / Netlify CDN caching for static assets
- [ ] Test Core Web Vitals via [PageSpeed Insights](https://pagespeed.web.dev) — aim LCP < 2.5s

### Legal & Compliance

- [ ] Write and publish **Privacy Policy** (required by Stripe and most jurisdictions)
- [ ] Write and publish **Terms of Service**
- [ ] Add cookie consent banner if targeting EU users (GDPR)
- [ ] Add links to Privacy Policy and Terms in footer and signup flow
- [ ] Ensure Stripe checkout links to Terms of Service URL

### Pre-Launch Testing

- [ ] Full regression test on production URL: every page loads, no console errors
- [ ] Auth flow: signup → email confirm → login → logout → password reset
- [ ] Billing flow: free → upgrade to Pro → subscription active → downgrade → cancel
- [ ] Agent flow: Research → stream response → save report → download report
- [ ] Opportunity flow: browse → filter → refresh category → save to watchlist
- [ ] Support chat: send message → receive AI response → send transcript email
- [ ] News page: loads articles → pagination works (if implemented)
- [ ] Mobile responsiveness: test at 375px width on all key pages

---

## 5. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS v3, shadcn/ui |
| Routing | React Router v6 |
| Backend | Supabase (Postgres + Auth + Storage) |
| Edge Functions | Supabase Edge Functions (Deno) |
| AI / LLM | Google Gemini 2.5 Flash (direct API) |
| News | The News API (direct API) |
| Payments | Stripe (Checkout + Portal + Webhooks) |
| Email | Resend |
| Icons | lucide-react |
| Forms | react-hook-form + zod |
| Markdown | streamdown |
| Toasts | sonner |

---

## 6. Repository Structure

```
kraitin/
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── layouts/            # AppLayout, UpgradeBanner
│   │   ├── ui/                 # shadcn/ui components (DO NOT EDIT)
│   │   ├── common/             # PaywallModal, shared components
│   │   ├── notifications/      # NotificationBell
│   │   └── support/            # SupportChat floating widget (Kira)
│   ├── contexts/
│   │   └── AuthContext.tsx     # Auth state, subscription status
│   ├── db/
│   │   └── supabase.ts         # Supabase client initialisation
│   ├── lib/
│   │   ├── utils.ts            # cn() helper
│   │   └── sse.ts              # SSE streaming helper for AI agents
│   ├── pages/                  # One file per route/page
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── DashboardHomePage.tsx
│   │   ├── OpportunitiesPage.tsx
│   │   ├── ResearchAgentPage.tsx
│   │   ├── LaunchAgentPage.tsx
│   │   ├── MvpPlannerPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── WatchlistPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── BillingPage.tsx
│   ├── types/
│   │   └── types.ts            # Shared TypeScript types
│   ├── routes.tsx              # Route definitions
│   ├── App.tsx                 # Root app with BrowserRouter
│   └── index.css               # Design tokens + global styles
├── supabase/
│   ├── config.toml             # Supabase local config
│   ├── migrations/             # SQL migration files (DO NOT EDIT MANUALLY)
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_kraitin_billing_v2.sql
│   │   ├── 00003_add_founder_profiles.sql
│   │   ├── 00004_affiliate_system.sql
│   │   ├── 00005_seed_opportunities_300.sql
│   │   └── ...
│   └── functions/              # Supabase Edge Functions (Deno)
│       ├── ai-search/          # Gemini AI search — SSE streaming
│       ├── all-news/           # News feed via The News API
│       ├── create-checkout/    # Stripe Checkout session
│       ├── export-report/      # Report export to Markdown
│       ├── refresh-opportunities/ # AI-powered category refresh
│       ├── stripe-portal/      # Stripe billing portal
│       ├── stripe-webhook/     # Stripe webhook handler
│       └── support-chat/       # Kira AI support + Resend email
├── .env.example                # Template for local env vars
├── .env.local                  # Your local secrets (DO NOT COMMIT)
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 7. Feature Reference

### Opportunity Discovery (`/opportunities`)
- 338 scored startup opportunities across 8 categories: **AI, Health, Education, Productivity, B2B SaaS, Consumer, Mobile Apps, Finance**
- Each card: Opportunity Score (1–100), Competition Score, Market Size (TAM), Revenue Estimate (MRR range), Growth % YoY, Growth Velocity (Explosive / Rising / Stable)
- **Trending Now** banner — top 3 highest growth % opportunities
- **Hidden Gems** filter — low-competition, underserved niches
- **Refresh Data** — calls `refresh-opportunities` to AI-generate fresh opportunities for any category
- Category tabs with live counts, search and filter support

### Research Agent (`/research`)
- Any startup idea → comprehensive AI market research report
- Gemini 2.5 Flash, real-time streaming via SSE
- Reports auto-saved to the Reports page
- Pre-fills from opportunity cards via `?q=` URL param

### Launch Agent (`/launch-agent`)
- Any startup idea → full go-to-market strategy
- Covers: launch channels, positioning, pricing, 90-day roadmap, growth hacks, KPIs
- Pre-fills from opportunity cards via `?q=` URL param

### MVP Planner (`/mvp-planner`)
- Breaks any idea into a buildable MVP with feature prioritisation, tech stack suggestions, phased roadmap

### News Intelligence (`/news`)
- Curated startup and tech news via The News API
- Subscription-gated (active subscription required)
- Rate-limited to 60 requests/user/hour

### Reports (`/reports`)
- All Research + Launch outputs auto-saved, searchable by title, filterable by type
- Download as Markdown files

### Watchlist (`/watchlist`)
- One-click save any opportunity with full details: score, category, revenue, growth, tags

### Kira Support Chat
- Floating widget on all authenticated pages (bottom-right)
- AI-powered with full KRAITIN knowledge base, conversation history stored in Supabase
- Auto-emails full transcript via Resend on chat close; manual send button also available

### Billing (`/billing`)
- Stripe Checkout + Portal — Free / Pro ($29/mo) / Growth ($79/mo) tiers

---

## 8. Local Development Setup

### Prerequisites

- **Node.js** v18+ — [nodejs.org](https://nodejs.org)
- **pnpm** — `npm install -g pnpm`
- **Supabase CLI** — `npm install -g supabase`
- A **Supabase** account — [supabase.com](https://supabase.com)
- A **Stripe** account — [stripe.com](https://stripe.com)
- A **Resend** account — [resend.com](https://resend.com)
- A **Google AI Studio** account — [aistudio.google.com](https://aistudio.google.com) (for `GEMINI_API_KEY`)
- A **The News API** account — [thenewsapi.com](https://www.thenewsapi.com) (for `THE_NEWS_API_KEY`)

### Step 1 — Clone & Install

```bash
git clone <your-repo-url> kraitin
cd kraitin
pnpm install
```

### Step 2 — Configure Environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values (see [Section 9](#9-environment-variables)).

### Step 3 — Set Up Supabase

See [Section 10](#10-supabase-setup) for full instructions.

### Step 4 — Run Locally

```bash
pnpm dev
```

The app runs at `http://localhost:5173`.

---

## 9. Environment Variables

### Frontend (`.env.local`)

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_ID=your-app-id
```

- `VITE_SUPABASE_URL` — Supabase Dashboard → Project Settings → API → Project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase Dashboard → Project Settings → API → `anon public` key

> ⚠️ Never put `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` in `.env.local` — server-side only, set via Supabase Secrets.

### Backend — Supabase Edge Function Secrets

Set via CLI (`supabase secrets set KEY="value"`) or Supabase Dashboard → Project Settings → Edge Functions → Secrets:

| Secret | Description | Where to get it |
|---|---|---|
| `SUPABASE_URL` | Auto-injected | Automatic |
| `SUPABASE_ANON_KEY` | Auto-injected | Automatic |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected | Automatic |
| `GEMINI_API_KEY` | Google Gemini 2.5 Flash API key | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `THE_NEWS_API_KEY` | The News API token | [thenewsapi.com](https://www.thenewsapi.com) → Dashboard |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | e.g. `http://localhost:5173,https://yourdomain.com` |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe Dashboard → Webhooks |
| `STRIPE_MONTHLY_PRICE_ID` | Stripe Price ID for monthly plan | Stripe Dashboard → Products |
| `STRIPE_YEARLY_PRICE_ID` | Stripe Price ID for yearly plan | Stripe Dashboard → Products |
| `RESEND_API_KEY` | Resend API key for support emails | resend.com → API Keys |

---

## 10. Supabase Setup

### Option A — Existing Project (migrating)

Your Supabase project already has all tables and data. You just need to:
1. Copy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Supabase dashboard
2. Set all secrets (Section 9) via CLI or dashboard
3. Redeploy edge functions (Section 11)

### Option B — New Supabase Project

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push   # creates all tables, RLS policies, seeds opportunity data
```

### Authentication

KRAITIN uses Supabase Auth (email/password):
- **Authentication → Providers** — Email enabled by default
- **Authentication → Email Templates** — customise confirmation emails
- **Authentication → URL Configuration** — set Site URL to your domain

### Row Level Security

All tables have RLS enabled. Key rules:
- Users can only read/write their own data
- `opportunities` is readable by all authenticated users
- `support_conversations` and `support_messages` are scoped to the owning user

---

## 11. Edge Functions

KRAITIN has 8 edge functions. Deploy all after cloning:

```bash
supabase login
supabase link --project-ref your-project-ref

# Set all secrets first
supabase secrets set GEMINI_API_KEY="your_gemini_api_key"
supabase secrets set THE_NEWS_API_KEY="your_news_api_token"
supabase secrets set ALLOWED_ORIGINS="http://localhost:5173,https://yourdomain.com"
supabase secrets set STRIPE_SECRET_KEY="sk_live_..."
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
supabase secrets set STRIPE_MONTHLY_PRICE_ID="price_..."
supabase secrets set STRIPE_YEARLY_PRICE_ID="price_..."
supabase secrets set RESEND_API_KEY="re_..."

# Deploy all functions
supabase functions deploy ai-search
supabase functions deploy all-news
supabase functions deploy create-checkout
supabase functions deploy export-report
supabase functions deploy refresh-opportunities
supabase functions deploy stripe-portal
supabase functions deploy stripe-webhook
supabase functions deploy support-chat
```

### Function Reference

| Function | Trigger | Purpose |
|---|---|---|
| `ai-search` | POST — Research/Launch/MVP agents | Streams Gemini 2.5 Flash via SSE using direct Google AI API |
| `all-news` | POST — News page | Fetches from The News API directly |
| `create-checkout` | POST — Billing page | Creates Stripe Checkout session |
| `export-report` | POST — Reports page | Generates downloadable Markdown report |
| `refresh-opportunities` | POST — Opportunities page | Generates fresh AI-researched opportunities, writes to DB |
| `stripe-portal` | POST — Billing page | Creates Stripe Customer Portal session |
| `stripe-webhook` | POST — Stripe | Handles payment events, updates `subscriptions` table |
| `support-chat` | POST — Kira widget | AI support chat + transcript email via Resend |

### Adding a New Edge Function

```bash
mkdir supabase/functions/my-function
# write supabase/functions/my-function/index.ts
supabase functions deploy my-function
```

**Starter template** (copy this — it includes CORS, auth, and Gemini patterns):
```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map(s => s.trim()).filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Vary": "Origin",
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  // Gemini non-streaming
  const geminiKey = Deno.env.get("GEMINI_API_KEY")!;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, generationConfig }),
    }
  );

  // Gemini streaming (SSE)
  // const res = await fetch(
  //   `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${geminiKey}`,
  //   { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents }) }
  // );
});
```

---

## 12. Stripe Payments Setup

### Step 1 — Create Products

In Stripe Dashboard → **Products**:
1. **Pro** → monthly price $29/mo, yearly $290/yr
2. **Growth** → monthly price $79/mo, yearly $790/yr
3. Copy all `price_xxx` IDs

### Step 2 — Set Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY="sk_live_your_key"
supabase secrets set STRIPE_MONTHLY_PRICE_ID="price_pro_monthly_id"
supabase secrets set STRIPE_YEARLY_PRICE_ID="price_pro_yearly_id"
```

### Step 3 — Register Webhook

Stripe Dashboard → **Webhooks → Add Endpoint**:
- **URL**: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
- **Events**: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_your_secret"
```

### Step 4 — Test Locally

```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

---

## 13. Resend Email Setup

Used to email Kira support transcripts to your inbox.

```bash
# 1. Sign up at resend.com → API Keys → Create API Key
supabase secrets set RESEND_API_KEY="re_your_api_key"
```

**To use your own domain** (recommended for production):
1. Add and verify your domain in Resend → Domains
2. Update the `from` field in `supabase/functions/support-chat/index.ts`:
   ```typescript
   from: "Kira at KRAITIN <support@yourdomain.com>",
   ```
3. Redeploy: `supabase functions deploy support-chat`

> Resend free tier: 3,000 emails/month, 100/day. The default `onboarding@resend.dev` sender works without domain setup but may hit spam folders.

---

## 14. Database Schema

Full schema in `supabase/migrations/`. Key tables:

| Table | Key Fields |
|---|---|
| `profiles` | `id`, `email`, `display_name`, `subscription_tier`, `subscription_status`, `stripe_customer_id` |
| `opportunities` | `id`, `title`, `category`, `description`, `revenue_estimate`, `downloads`, `market_size`, `growth_percent`, `competition_score`, `opportunity_score`, `growth_velocity`, `is_hidden_gem`, `tags[]` |
| `watchlist` | `id`, `user_id`, `opportunity_id`, `created_at` |
| `reports` | `id`, `user_id`, `title`, `type` (research/launch), `content`, `created_at` |
| `notifications` | `id`, `user_id`, `title`, `message`, `read`, `created_at` |
| `subscriptions` | `id`, `user_id`, `stripe_subscription_id`, `status`, `price_id`, `current_period_end` |
| `paywall_events` | `id`, `user_id`, `event_type`, `metadata`, `created_at` |
| `support_conversations` | `id`, `user_id`, `user_email`, `status`, `created_at` |
| `support_messages` | `id`, `conversation_id`, `role`, `content`, `created_at` |
| `founder_profiles` | `id`, `user_id`, `bio`, `stage`, `goals`, `updated_at` |
| `affiliate_referrals` | `id`, `referrer_id`, `referred_id`, `created_at` |

---

## 15. Deploying to Production

### Recommended: Vercel

```bash
# 1. Push repo to GitHub
# 2. Import at vercel.com → add env vars:
#    VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_APP_ID
# 3. Deploy
```

### Alternative: Netlify

```bash
pnpm build
netlify deploy --prod --dir=dist
# Set VITE_* env vars in Netlify → Site Settings → Environment Variables
```

### Post-Deploy Checklist

```bash
# Update Supabase Auth
# Auth → URL Configuration → Site URL: https://yourdomain.com
# Auth → URL Configuration → Redirect URLs: https://yourdomain.com/**

# Update CORS and redeploy all functions
supabase secrets set ALLOWED_ORIGINS="https://yourdomain.com,http://localhost:5173"
supabase functions deploy ai-search
supabase functions deploy all-news
supabase functions deploy create-checkout
supabase functions deploy export-report
supabase functions deploy refresh-opportunities
supabase functions deploy stripe-portal
supabase functions deploy stripe-webhook
supabase functions deploy support-chat
```

---

## 16. Continuing Development

### Adding a New Page

1. Create `src/pages/MyNewPage.tsx`
2. Register in `src/routes.tsx`: `{ path: '/my-page', element: <MyNewPage /> }`
3. Add a nav entry in `src/components/layouts/AppLayout.tsx` in the `NAV` array

### Adding a New AI Feature

1. Create `supabase/functions/my-agent/index.ts` using the template in Section 11
2. For **non-streaming**: use `:generateContent?key=${geminiKey}` endpoint
3. For **streaming**: use `:streamGenerateContent?alt=sse&key=${geminiKey}` endpoint
4. Deploy: `supabase functions deploy my-agent`

### Adding a New Database Table

```sql
-- In Supabase SQL Editor or a new migration file
create table public.my_table (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);
alter table public.my_table enable row level security;
create policy "Users manage own rows" on public.my_table
  for all using (auth.uid() = user_id);
```

### Modifying Kira's Knowledge Base

Edit `SYSTEM_PROMPT` in `supabase/functions/support-chat/index.ts`, then:
```bash
supabase functions deploy support-chat
```

### Modifying the Opportunity Refresh Prompt

Edit the `PROMPT` function in `supabase/functions/refresh-opportunities/index.ts`, then:
```bash
supabase functions deploy refresh-opportunities
```

### Design System

Tokens defined in `src/index.css` and `tailwind.config.js`:
- **Accent colour**: `#C5FF00` (lime green)
- **Background**: `#050507` (near black)
- Use semantic tokens only: `bg-primary`, `text-foreground`, `border-border`
- Never use raw Tailwind colour classes like `bg-green-500`

---

## 17. Common Issues & Fixes

### "Blank screen after `pnpm dev`"
- Confirm `.env.local` exists with correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Run `pnpm install` to ensure all dependencies are present
- Check browser console for specific errors

### "Supabase connection error"
- Verify both `VITE_*` values are correct and the project is not paused
- Free-tier projects pause after 1 week of inactivity — resume from the Supabase dashboard
- For production, upgrade to a paid Supabase plan to prevent pausing

### "Edge function returns 401"
- JWT expired or missing — log out and back in
- Ensure `ALLOWED_ORIGINS` includes your current origin

### "AI agents return error or no response"
- Confirm `GEMINI_API_KEY` is set: Supabase Dashboard → Project Settings → Edge Functions → Secrets
- Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- Redeploy after setting: `supabase functions deploy ai-search`

### "News page shows error"
- Confirm `THE_NEWS_API_KEY` is set in Supabase secrets
- Get a free token at [thenewsapi.com](https://www.thenewsapi.com)
- Redeploy: `supabase functions deploy all-news`

### "Stripe payments not working"
- Confirm test vs live keys match — both `STRIPE_SECRET_KEY` and frontend environment must use the same mode
- Check `STRIPE_WEBHOOK_SECRET` matches the signing secret shown in Stripe Dashboard → Webhooks
- Check Stripe Dashboard → Events for failed webhook deliveries

### "Support emails not arriving"
- Verify `RESEND_API_KEY` is set and valid
- Check Resend Dashboard → Emails for delivery status
- Check spam — `onboarding@resend.dev` may trigger filters; set up a custom domain for production

### "CORS error on edge function call"
- Add your origin to `ALLOWED_ORIGINS` and redeploy the affected function
- Format: `supabase secrets set ALLOWED_ORIGINS="https://yourdomain.com,http://localhost:5173"`

---

## Support

Chat with Kira inside the app for product questions. For infrastructure or code questions, reference this README.

**Owner:** theonyekachithompson@gmail.com
