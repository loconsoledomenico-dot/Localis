# Guide Builder Readability Refresh

**Date:** 2026-05-31  
**Area:** `src/components/GuideBuilder.astro`  
**Scope:** Only the `Scegli le tue storie` builder section

## Goal

Improve mobile readability in the guide selection builder by removing low-value truncated text from cards and simplifying the header copy.

This change is intentionally local to the builder screen. It must not alter guide cards used elsewhere in the site.

## Approved Direction

Use the minimal, direct approach:

- Remove the truncated descriptive text from each builder card.
- Keep only three content elements inside each card:
  - guide title
  - guide subtitle
  - a clear duration label, visually readable at a glance
- Replace the current Italian builder header copy with the exact approved text:

`Scegli le tue storie.`

`Crea il tuo itinerario ideale. Lo sconto si applica automaticamente nel carrello.`

`Durata media di ogni guida: 30 minuti | Disponibile in: 🇮🇹 🇬🇧 🇩🇪`

## Content Rules

- Apply the new copy exactly in Italian for this screen.
- Do not keep the current pricing explanation paragraphs in the builder header.
- Do not show truncated descriptive body copy inside builder cards.
- Duration should be expressed as a compact, explicit affordance, for example `⏱️ 30 min`.
- Geographic grouping by area (`Bari`, `Valle d'Itria`, `Gargano`) stays unchanged.
- Cover imagery stays unchanged.

## UI Notes

- The header should feel lighter and more immediate than the current version.
- Card metadata should breathe more on small screens once the truncated copy is removed.
- Duration should be easy to scan on a phone in bright outdoor conditions.
- The hierarchy inside each card should be:
  1. title
  2. subtitle
  3. duration

## Implementation Boundaries

- Update only `src/components/GuideBuilder.astro` unless a strictly necessary helper import is needed for duration formatting.
- Do not modify shared guide card components or guide detail pages.
- Do not change checkout logic, pricing logic, selection logic, or zone grouping logic.

## Verification

- Confirm the builder header now uses the approved Italian copy.
- Confirm each builder card no longer contains truncated descriptive text.
- Confirm each builder card shows a readable duration label.
- Confirm layout remains usable on mobile widths.
- Confirm no other guide card layouts on the site are affected.
