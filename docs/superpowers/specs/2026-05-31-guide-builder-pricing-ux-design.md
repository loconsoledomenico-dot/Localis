# Guide Builder Pricing UX Design

**Date**: 2026-05-31  
**Scope**: `GuideBuilder`, pricing cards on zone pages, homepage pricing summary, checkout-facing product labels  
**Status**: Approved in chat, pending final file review

## Problem

The current pricing experience asks the user to translate bundle rules into mental math at the exact moment they are deciding whether to buy.

The main cognitive bottlenecks are:

- The introductory copy explains pricing through text rules instead of through the interface state.
- `Tris`, `Sestina`, and `Zona completa` are product names that require interpretation before they communicate value.
- The 6-guide offer is ambiguous because the interface presents both a free-choice 6-pack and a complete-area 6-pack at the same price.
- Pricing language changes between the guide builder, zone landing pages, homepage summaries, and checkout labels.

This creates hesitation at the bottom of the funnel, especially for users who are already ready to pay and only need a clear confirmation that they are making the right purchase.

## Goals

- Remove the need for manual price calculation.
- Replace internal bundle jargon with plain-language product names.
- Make the sticky action bar explain the current selection and applied discount in real time.
- Show `Intera Zona` only when it is factually true.
- Keep technical product slugs unchanged where useful, while changing customer-facing language everywhere.

## Non-Goals

- No Stripe pricing changes.
- No bundle structure changes.
- No checkout flow redesign beyond copy and labels.
- No catalog restructuring beyond pricing and selection clarity.

## Approved UX Direction

### 1. Pricing language

Customer-facing naming will be simplified to:

- `Guida singola` / `Single guide`
- `Pack 3 Guide` / `Pack 3 Guides`
- `Pack 6 Guide` / `Pack 6 Guides`
- `Intera Zona` / `Complete Area` only as a contextual qualifier, never as a separate core product name

Internal product slugs such as `tris`, `sestina`, `bari-completa`, `valle-completa`, and `gargano-completa` may remain unchanged in code and checkout payloads.

### 2. Builder hero copy

The text above the guide grid must stop explaining bundle logic in detail.

It should instead:

- lead with a benefit-oriented headline such as `Più ascolti, meno paghi`
- use a short supporting line such as `Scegli le guide che vuoi. Lo sconto si applica da solo.`
- avoid exposing rule-heavy distinctions between cross-zone bundles and zone-complete bundles

The builder itself should teach the model through interaction, not through paragraphs.

### 3. Sticky bar behavior

The sticky bar becomes the primary explanation layer for pricing.

It must update in real time based on selection count and zone composition.

Required states:

- `0 guide`: disabled CTA with instruction to select at least one guide
- `1 guida`: enabled CTA with single-guide total
- `2 guide`: explain that one more guide activates Pack 3
- `3 guide`: explicitly confirm that Pack 3 is applied and show discounted total
- `4-5 guide`: explain how many more guides are needed to activate Pack 6
- `6 guide, mixed zones`: confirm `Pack 6 Guide` and show total without claiming `Intera Zona`
- `6 guide, same zone`: confirm `Pack 6 Guide (Intera Zona)` and show total
- `18 guide`: confirm `Puglia Completa`

The sticky bar copy should answer three questions at once:

- how many guides are selected
- which price tier is active or nearest
- what total the user would pay now

### 4. Zone-page pricing cards

Zone landing pages should use the same product language as the builder.

The 3-card structure becomes:

- `Guida singola`
- `Pack 3 Guide`
- `Pack 6 Guide (Intera Zona)`

This preserves the commercial offer while removing the false impression that `Zona completa` is a separate pricing logic from the 6-pack.

### 5. Homepage and summary copy

Any summary row or helper copy that currently says `Tris`, `Sestina`, or explains bundle rules in prose should be updated to the same naming system used in the builder and pricing cards.

The customer should not need to translate between pages.

### 6. Checkout-facing labels

Checkout product descriptions should match the public naming system as closely as possible.

Recommended mapping:

- `tris` -> `Pack 3 Guide`
- `sestina` -> `Pack 6 Guide`
- `bari-completa` / `valle-completa` / `gargano-completa` -> `Pack 6 Guide (Intera Zona)` or localized equivalent

This avoids a mismatch between what the user selected and what Stripe shows.

## Interaction Rules

### Rule: when to show `Intera Zona`

`Intera Zona` appears only when all 6 selected guides belong to the same zone.

It must not appear when:

- the user has selected fewer than 6 guides
- the user has selected 6 guides across different zones
- the user is still in a partial-progress upsell state

### Rule: when to show savings

Savings messaging is useful only when it helps a decision quickly.

It may appear in the sticky bar or pricing cards, but it should always be subordinate to the total price and active pack name.

The user should first understand:

- what they are buying
- how many guides it includes
- what the total is

Only after that should the interface mention the saving.

## Content Design Notes

- Avoid requiring the user to compare two similar six-guide products.
- Avoid terminology that sounds internal or game-like unless immediately obvious.
- Prefer `Pack 3 Guide` and `Pack 6 Guide` over poetic or branded names in transactional contexts.
- Keep `Puglia Completa` as a distinct top-tier label because it is structurally different from the 6-guide offer.

## Technical Implications

Implementation is expected to touch:

- `src/components/GuideBuilder.astro`
- `src/components/PriceCard.astro`
- zone pages such as `src/pages/bari.astro`, `src/pages/valle-d-itria.astro`, `src/pages/gargano.astro`, and localized equivalents
- homepage pricing summaries
- checkout label mapping in `src/pages/api/checkout.ts`

No backend pricing logic needs to change if current validation and Stripe price generation already support the same products.

## Testing Expectations

Verify at minimum:

- sticky bar copy and CTA text for 0, 1, 2, 3, 4, 5, 6, and 18 selected guides
- correct distinction between mixed-zone 6 selections and same-zone 6 selections
- consistent labels across Italian and English surfaces touched by the change
- checkout labels align with the UI labels
- no broken flow for existing product slugs and selection validation

## Scope Check

This is a single implementation slice, not a multi-project initiative.

It is focused on pricing clarity and conversion UX, and can be implemented without changing the business model or payment architecture.
