# Localis

Audioguide narrative della Puglia. localis.guide

## Stack

- Astro 5 + Tailwind CSS
- TypeScript (strict)
- Stripe Checkout + Connect
- Resend (email)
- Cloudflare R2 (audio storage)
- ElevenLabs (voice)
- Plausible (analytics)
- Sentry (errors)

## Local development

```bash
pnpm install
pnpm dev
```

Open http://localhost:4321

## Deploy

Push to `main` triggers Netlify production deploy. Push to any other branch creates a preview deploy.

## Documentation

- Design context: [.impeccable.md](./.impeccable.md)
- Spec: [docs/superpowers/specs/2026-04-28-localis-restructure-design.md](./docs/superpowers/specs/2026-04-28-localis-restructure-design.md)
- Plan: [docs/superpowers/plans/2026-04-28-localis-phase-0-foundation.md](./docs/superpowers/plans/2026-04-28-localis-phase-0-foundation.md)
