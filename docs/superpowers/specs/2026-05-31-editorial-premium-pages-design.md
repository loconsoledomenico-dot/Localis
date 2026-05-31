# Localis - Design Document: Editorial Premium Pages Refresh

**Date**: 2026-05-31  
**Status**: Pending user spec review  
**Scope**: Institutional pages, legal shell, footer, and guide detail trust layer

---

## 1. Summary

Localis already sounds premium in its core copy and product promise, but several high-trust pages still behave like neutral information pages instead of an editorial brand surface. The mismatch is strongest on `Fonti`, `Chi siamo`, footer/legal pages, and single-guide landing pages. These are not secondary utilities: they are the places where users verify whether the premium promise is real.

This design introduces a shared editorial trust layer across those pages. The goal is not a visual reinvention of the site, but a focused refactor that makes research, authorship, service information, and purchase-decision details feel intentionally curated in every supported language.

---

## 2. Problem Statement

The current issues are structural, not cosmetic:

- `Fonti` proves rigor, but reads like a cold bibliography instead of a compelling research process.
- `About` explains the manifesto, but does not sufficiently show the humans behind the work.
- footer and legal pages inherit the correct palette, but not the same editorial hierarchy and breathing room as the rest of the brand.
- guide detail pages present the trailer and purchase path, but leave out practical trip-decision information a buyer needs before purchase.

Together, these gaps weaken trust exactly where the user is trying to validate price, authorship, rigor, and usability.

---

## 3. Goals And Non-Goals

### Goals

- Make research feel premium, legible, and story-driven without losing verifiability.
- Make the authors and editorial method visibly human.
- Bring footer and legal surfaces up to the same visual standard as the commercial pages.
- Add a compact technical facts layer to guide detail pages so users can judge fit before buying.
- Implement the new structure consistently across Italian, English, and German, including creating missing German institutional pages where needed.
- Prefer reusable components and content schema extensions over one-off page-specific hacks.

### Non-goals

- Rewriting the legal substance of privacy, terms, or cookie documents.
- Rebranding the site or changing the core design system.
- Replacing existing guide purchase or playback flows.
- Expanding every guide with long-form editorial essays.

---

## 4. Recommended Approach

Recommended approach: **a targeted editorial refactor with reusable trust components and small content-model extensions.**

This is the right level of intervention because it produces a visible brand upgrade while preserving the current Astro architecture, routing model, and visual language. The system already has strong tokens, imagery, and typographic direction; the missing layer is component structure and content framing.

The implementation should center on four additions:

- narrative source framing for `Fonti`
- author/profile storytelling for `About`
- premium legal shell and richer footer composition
- compact technical guide facts for guide detail pages

---

## 5. Experience Design By Area

### 5.1 Sources Page

`/fonti`, `/en/fonti`, and the future `/de/fonti` should shift from passive bibliography to editorial proof.

Each guide block should include:

- guide title
- last review date
- short narrative research note explaining how the material was gathered, verified, or reconstructed
- chapter sections that state what the chapter is substantiating before listing sources

The key interaction change is cognitive, not functional: the user should understand that Localis has already done the archival work on their behalf.

Structure per guide:

1. Guide heading and review metadata
2. Research story block
3. Chapter-by-chapter evidence sections
4. Source list grouped under each chapter claim or proof statement

The bibliography must remain complete and transparent. The new layer should clarify why the sources matter, not obscure them.

### 5.2 About / Manifesto

`/about`, `/en/about`, and a new `/de/about` should become the human proof page of the brand.

The page should contain:

- short manifesto intro
- founder block for Domenico and Luigi
- contributor or narrator profile grid where there are available people/assets worth surfacing
- compact editorial method section
- roadmap retained as a lower-priority closing section

Each profile should communicate:

- name
- role or area of expertise
- relation to the place
- one concrete credibility line

This page must answer the implicit buyer question: "Who actually made this, and why should I trust their eye?"

### 5.3 Footer And Legal Shell

The footer should remain functionally compact, but feel more like a refined publisher signature than a utility strip.

The updated footer should emphasize:

- calmer spacing
- clearer grouping between brand statement and service links
- better mobile wrapping
- stronger hierarchy for the brand line and editorial promise

Legal pages should keep their exact legal meaning, but move into a shared presentation shell with:

- consistent title block
- update metadata styling
- improved table treatment
- calmer paragraph rhythm
- a less abrupt transition from branded pages to service content

The experience target is continuity, not embellishment.

### 5.4 Guide Detail Pages

Guide detail pages in all languages should gain a compact decision-support module near the top of the content stack.

The technical facts block should include, when available:

- estimated walking distance
- number of stops or audio chapters
- route mode or pacing cue
- accessibility note
- what the user needs

This block should be concise, fast to scan outdoors, and clearly subordinate to the emotional sales layer while still solving the current information gap.

If a guide lacks one or more data points, the UI must degrade gracefully rather than forcing placeholder copy.

---

## 6. Content Model Changes

The current content model is close, but not yet expressive enough for this editorial layer.

### Guides collection

Add optional fields for operational guide facts, for example:

- `distance_km`
- `stops_count` or derive from chapters where appropriate
- `accessibility_it`, `accessibility_en`, `accessibility_de`
- `needs_it`, `needs_en`, `needs_de`
- optional route mode or terrain note if needed

The schema should allow missing values so existing live guides do not break during rollout.

### Sources collection

Add optional editorial fields at guide or chapter level, for example:

- guide-level research note in `it`, `en`, `de`
- chapter-level framing sentence or proof summary in `it`, `en`, `de`

If German source pages are introduced before every source entry is fully localized, the structure should support deliberate fallback copy rather than silent omissions.

### About page data

If the profile grid becomes larger than a simple inline page constant, it should move into structured data or a dedicated content file. For this first pass, a local page-level data structure is acceptable if it stays concise and reusable across locales.

---

## 7. Localization Rules

This work is explicitly multilingual.

Requirements:

- Italian, English, and German must all receive the upgraded structure where equivalent pages exist.
- Missing German institutional pages should be created as part of this project, not deferred.
- Localized pages must not feel like shell copies of Italian originals with broken information scent.
- Where source material or claims originate in Italian research language, this can be explained explicitly in copy, but the page structure must remain fully coherent in English and German.

For guide detail pages, localization should rely on shared helpers where possible so the new technical facts module does not fork unnecessarily across three templates.

---

## 8. Component Strategy

This refactor should prefer new reusable components over inflating page templates with ad hoc markup.

Likely component additions:

- `LegalPageShell`
- `GuideFactsCard` or equivalent facts module
- `AuthorProfileGrid` or profile card group
- `SourcesResearchBlock` and/or a reusable claim block

The exact file count is less important than keeping page templates readable and preventing duplicated structure across locales.

---

## 9. Error Handling And Fallbacks

The redesign introduces more structured content, so fallbacks must be intentional.

- Missing optional guide facts should hide the specific row, not the whole module unless the card becomes too sparse.
- Missing narrator or contributor imagery should still allow a text-first profile treatment.
- Missing German institutional pages today must be resolved by creation, not by linking users into dead ends.
- Source entries without URLs remain valid and should still render as archival references.

No page should expose placeholder text, `TBD`, or visibly incomplete metadata.

---

## 10. Testing And Verification

Minimum verification should cover:

- `fonti`, `about`, legal pages, footer, and guide detail in Italian
- equivalent English pages
- newly created or updated German institutional pages
- mobile readability and spacing for footer/legal shells
- graceful rendering of guides with partial technical facts
- no schema regressions in content loading
- no broken localized links from footer navigation

Visual QA matters here as much as functional QA. The success criterion is not only "renders correctly" but "feels like the same premium product family."

---

## 11. Rollout Recommendation

Ship this as one coordinated editorial refactor rather than several unrelated micro-fixes.

Recommended sequence:

1. extend schemas and shared helpers
2. build reusable trust components
3. refactor `Fonti` and `About`
4. refactor footer and legal shell
5. add guide facts module to guide detail pages
6. complete English and German parity

This sequence keeps structural work first and content-facing integration second, reducing rework while preserving momentum.
