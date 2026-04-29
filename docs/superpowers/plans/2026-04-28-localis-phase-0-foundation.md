# Localis Phase 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a production-grade audioguide e-commerce site at `localis.guide` that takes payments via Stripe (with partner commission split via Stripe Connect), delivers audio via offline-capable Service Worker, and replaces the current drag-and-drop static deploy with a Git-driven Astro 5 codebase.

**Architecture:** Astro 5 SSG → static HTML deployed via Netlify Git integration. Stripe Checkout (hosted) handles payments; webhook generates JWT magic links and sends via Resend. Audio served from Cloudflare R2 with 1h-signed URLs, watermarked per buyer, cached offline by Service Worker. Tailwind CSS with OKLCH design tokens (Spectral + Schibsted Grotesk typography). All under `/impeccable` skill constraints.

**Tech Stack:** Astro 5, Tailwind CSS, TypeScript, Stripe + Stripe Connect Standard, Resend, Cloudflare R2, ElevenLabs API, JWT (jsonwebtoken), Plausible, Sentry, GitHub, Netlify, Vitest, Playwright.

**Scope reference:** [2026-04-28-localis-restructure-design.md](../specs/2026-04-28-localis-restructure-design.md)

**Estimated effort:** 80-100 hours (Luigi engineering); 40-60 hours additional for content production (Domenico, parallel track in Milestone D).

---

## Decomposition

Phase 0 is split into **6 milestones**. Each is delivered to a staging URL and independently verifiable. Each milestone has its own plan file:

| Milestone | File | Goal | Approx. effort |
|-----------|------|------|----------------|
| **A — Foundation** ✅ | `2026-04-28-localis-phase-0-A-foundation.md` | Repo, Astro+Tailwind, design tokens, base layout components, deploy preview to Netlify | 12-16h |
| **B — Public site** ✅ | `2026-04-28-localis-phase-0-B-public-site.md` | Homepage IT/EN, guide pages with trailer + paywall stub, legal pages, content collections | 16-20h |
| **C — Payments** | `2026-04-28-localis-phase-0-C-payments.md` | Stripe Products, Checkout endpoint, webhook, Resend email delivery, JWT, magic link | 14-18h |
| **D — Audio access** | `2026-04-28-localis-phase-0-D-audio-access.md` | R2 bucket, signed URLs, AudioPlayer, Service Worker offline cache, watermark generation | 16-20h |
| **E — Partner system** | `2026-04-28-localis-phase-0-E-partner-system.md` | Cookie attribution, Stripe Connect Standard onboarding, transfer_data split, /p/[slug] landings | 10-14h |
| **F — SEO & polish** | `2026-04-28-localis-phase-0-F-seo-polish.md` | Sitemap, structured data, OG images, Plausible, Sentry, recovery flow, 404, Lighthouse 90+ | 12-16h |

**Dependency graph:**

```
A (foundation)
  ↓
B (public site) ────────┐
  ↓                     │
C (payments) ───────────┤
  ↓                     │
D (audio access) ───────┤
  ↓                     │
E (partner system) ─────┤
                        ↓
                    F (SEO & polish)
```

A is strict prerequisite for everything. B, C, D, E build sequentially — each depends on the previous. F can begin in parallel with E once C is done (sitemap + analytics don't need partner system), but completes last.

---

## Prerequisites (one-time setup, before Milestone A)

The engineer must have these accounts/secrets ready before starting. Most exist already per the spec; verify each.

### Accounts to verify or create

- [ ] **GitHub account** with ability to create private repos (Luigi's existing account)
- [ ] **Netlify account** (existing, already deploying current site)
- [ ] **Stripe account** (already provisioned per spec) — verify in test mode + obtain test API keys
- [ ] **Resend account** — sign up at https://resend.com (free 3k email/mo); verify ownership of `localis.guide` domain via DNS records (SPF, DKIM, DMARC)
- [ ] **Cloudflare account** — sign up if not already; navigate to R2 dashboard (https://dash.cloudflare.com/?to=/:account/r2)
- [ ] **ElevenLabs account** — sign up; defer Creator $22/mo subscription until Milestone D voice cloning step
- [ ] **Plausible account** — sign up at https://plausible.io (€9/mo, 30-day trial)
- [ ] **Sentry account** — sign up at https://sentry.io (free tier)

### Domain DNS

- [ ] Verify `localis.guide` domain ownership (registrar access).
- [ ] Confirm Netlify is currently the DNS host or can become it (alternatively, point apex/www to Netlify via A/CNAME records).

### Local development environment

- [ ] **Node.js v20+** installed (`node -v` shows ≥20.0.0). Install via official installer or `nvm install 20`.
- [ ] **pnpm** installed globally: `npm install -g pnpm` (Astro projects work with pnpm/npm/yarn; pnpm preferred for disk efficiency).
- [ ] **Git** installed and configured: `git config --global user.name "Luigi Loconsole"` + `git config --global user.email "<your-email>"`.
- [ ] **GitHub CLI** installed (`gh --version`): https://cli.github.com/. Login: `gh auth login`.
- [ ] **Netlify CLI** installed: `npm install -g netlify-cli`. Login: `netlify login` (already done in earlier session).
- [ ] **Python 3.11+** installed for content production scripts (Milestone D): `python --version`.
- [ ] **VS Code** (or editor of choice) with extensions: Astro, Tailwind CSS IntelliSense, ESLint, Prettier.

### Environment variables (collected at start, used across milestones)

The engineer will populate `.env.local` (never committed) and Netlify environment dashboard incrementally. Master list:

```
# Stripe (Milestone C)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...    # Milestone E

# Resend (Milestone C)
RESEND_API_KEY=re_...

# JWT (Milestone C)
JWT_SECRET=<32+ random chars, generate with: openssl rand -hex 32>

# Cloudflare R2 (Milestone D)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=localis-audio
R2_PUBLIC_URL=https://<custom-domain-or-r2-dev>.r2.dev

# ElevenLabs (Milestone D, content production)
ELEVENLABS_API_KEY=...
DOMENICO_VOICE_ID=...

# Plausible (Milestone F)
PUBLIC_PLAUSIBLE_DOMAIN=localis.guide

# Sentry (Milestone F)
SENTRY_DSN=https://...@sentry.io/...
PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Site
PUBLIC_SITE_URL=https://localis.guide
```

`PUBLIC_*` prefix exposes vars to client-side code (Astro convention). Anything sensitive must NOT have `PUBLIC_`.

---

## Execution order

Execute milestones strictly in order **A → B → C → D → E → F**. After each milestone, the site must build, deploy successfully to Netlify preview URL, and pass all milestone exit criteria before proceeding.

**Branch strategy:**
- Main branch: `main` (protected, deploys to production `localis.guide` once apex DNS cut over).
- Working branch: `refactor/foundation-v2` for the entirety of Phase 0.
- After Phase 0 ships and current Netlify drag-and-drop site is decommissioned, `main` becomes production.

**Commit cadence:** every task ends with a commit. Milestone-end commit tag: `phase-0-A-complete`, `phase-0-B-complete`, etc.

**Deploy cadence:** Netlify preview URL auto-builds every push to `refactor/foundation-v2`. Manual smoke-test after each milestone.

---

## Self-review checklist (run at end of each milestone)

After completing a milestone:

1. **Spec coverage:** which spec sections did this milestone implement? (e.g., Milestone A covers spec §4 Architecture + §5 Brand setup tokens; B covers §5 components + §10 SEO basics + content schema)
2. **Lighthouse:** mobile run on staging. Performance ≥ 90, A11y ≥ 95, Best Practices ≥ 95, SEO ≥ 90.
3. **Type check:** `pnpm astro check` passes with 0 errors.
4. **Tests:** `pnpm test` passes; new tests added for new logic.
5. **Visual review:** open staging URL, compare against spec §5 brand tokens.
6. **Commit message review:** all commits in milestone follow Conventional Commits.

---

## Out of scope for Phase 0 (deferred to Phase 1+)

These are explicitly NOT in Phase 0 and must NOT be implemented:

- ❌ Voice cloning of Domenico (content production happens in Milestone D parallel track but voice clone training itself is Phase 1)
- ❌ AI pipeline `scripts/generate-guide.py` (Phase 1)
- ❌ City hub pages `/citta/<slug>` beyond Bari (Phase 5)
- ❌ Blog/storia content pages (Phase 3)
- ❌ Partner self-service dashboard `/partner/dashboard` (Phase 6)
- ❌ Puglia Pass €19.99 product (Phase 6)
- ❌ User accounts / "Le mie guide" page (Phase 7)
- ❌ PWA install manifest (Phase 7)
- ❌ GPS-aware audio mode (Phase 7)
- ❌ Microsoft Clarity heatmaps (Phase 3)
- ❌ Multi-language dynamic routing beyond IT/EN (forever — not in 18-month scope)

---

## Plan files

Each milestone plan file follows the same structure:
- Goal + architecture summary
- Files to create / modify
- Tasks broken into 2-5 minute steps
- Each step shows actual code/command, not "implement X"
- TDD where applicable (Vitest unit tests for business logic; Playwright E2E for critical flows)
- Commit at every step boundary
- Milestone exit criteria

Read milestones in order. Each links to the next.

➡️ **Start with [Milestone A — Foundation](2026-04-28-localis-phase-0-A-foundation.md)**

---

## Revision history

- 2026-04-28 — Plan created from approved spec
