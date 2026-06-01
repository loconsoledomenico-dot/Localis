# Language Entry Routing Design

**Date:** 2026-06-01  
**Area:** public routing, middleware, partner entry links, language persistence  
**Scope:** all public HTML pages that are not already prefixed with `/en/` or `/de/`

## Goal

Ensure foreign visitors land directly in the correct language version of the site, especially from QR codes, partner links, and first-time visits, without weakening the existing SEO structure.

The site already has separate localized URLs such as `/en/...` and `/de/...`, plus `hreflang` tags. The missing layer is entry routing: today, an unprefixed public URL defaults to Italian even when the visitor clearly prefers English or German.

## Approved Direction

Apply automatic language routing to **all public pages** when the request URL is not already language-prefixed.

The behavior should work in this priority order:

1. explicit `?lang=it|en|de` query parameter
2. saved language preference cookie
3. already-prefixed URL (`/en/...` or `/de/...`)
4. browser `Accept-Language`
5. fallback to Italian

## User Experience Rules

- A visitor opening `/guide/bari-vecchia` with browser language English should be redirected to `/en/guide/bari-vecchia`.
- A visitor opening `/valle-d-itria?p=hotel-foo&lang=de` should land on `/de/valle-d-itria?p=hotel-foo` and have German remembered.
- Manual language switching should persist the choice, so the next unprefixed visit respects the user's chosen language instead of the browser header.
- If the user is already on `/en/...` or `/de/...`, do not redirect again.
- If the preferred language is Italian, keep the current unprefixed URL.

## SEO Rules

- Keep the current URL structure:
  - Italian default without prefix
  - English under `/en/...`
  - German under `/de/...`
- Keep existing `hreflang` tags.
- Redirect only unprefixed public URLs to their localized equivalent when needed.
- Do not create duplicate content URLs for the same language beyond the existing structure.

## Query Parameter Rules

- Support `?lang=it|en|de` on public pages.
- `?lang=` must override browser detection and cookie state for the current request.
- When `?lang=` is present, save the resolved language to a cookie for later visits.
- Preserve useful query parameters during redirects, especially:
  - `p` partner attribution
  - checkout/session parameters where relevant
- Remove nothing except the need to normalize the final destination path.

## Cookie Rules

- Introduce a dedicated language preference cookie.
- It should be readable on the client and server.
- It should have the same broad site scope as the partner cookie.
- It should be updated when:
  - `?lang=` is used
  - the user explicitly changes language through the language switcher

## Protected / Excluded Routes

Do **not** apply public language redirects to:

- `/api/*`
- `/_astro/*`
- `/access/*`
- audio/file endpoints and other non-HTML asset routes
- any route where redirecting could break signed access, technical callbacks, or media delivery

The middleware should stay conservative: only redirect normal public page requests that return HTML.

## Partner / QR Rules

- Partner and hotel QR codes should support explicit language forcing with `?lang=en` or `?lang=de`.
- Existing partner attribution via `?p=` and `lg_partner` must keep working exactly as today.
- Redirect logic must preserve partner attribution when moving from unprefixed URLs to `/en/...` or `/de/...`.

## Checkout and Post-Checkout Rules

- Entry language should carry into checkout initiation wherever the page already sends `lang`.
- The current access links that already use `?lang=` should remain compatible with the new routing model.
- No automatic language redirect should interfere with private purchased access URLs.

## Technical Boundaries

- Prefer extending the existing middleware rather than inventing a second routing layer.
- Reuse the existing i18n helpers for locale path generation where possible.
- Update the language switcher so manual switching can persist the preference cookie.
- Keep the change focused on routing and language persistence. Do not mix it with unrelated copy or layout work.

## Verification

- Unprefixed Italian routes redirect to `/en/...` or `/de/...` when browser language prefers those locales.
- `?lang=` forces the route language and persists it.
- Prefixed localized routes do not redirect again.
- Partner query `?p=` survives redirects and still sets the partner cookie.
- `hreflang` output remains correct.
- Access and API routes remain unaffected.
