# Localis - Design Document: Success Page Instant Listening

**Date**: 2026-05-31  
**Status**: Pending user spec review  
**Scope**: Post-payment experience on `thanks.astro`

---

## 1. Summary

The current post-payment flow already verifies the Stripe session and can generate a valid access token, but the success page still behaves mainly like a confirmation screen with a single generic access action and strong email-first copy. For impulsive tourist purchases, that leaves unnecessary friction between "I paid" and "I am listening".

This design turns the success page into an immediate listening hub. Right after payment, the buyer should see the purchased guides, recognize them visually, and start listening with one tap. Email remains a backup and receipt channel, not the primary unlock path.

---

## 2. Problem Statement

Today the main risks in the post-payment step are:

- The page emotionally completes the transaction, but not the product use.
- The primary action is too abstract when multiple guides were purchased.
- The email is still over-emphasized for a user who is likely on the street, on mobile, and unwilling to switch apps.
- A failed or slow email delivery can feel like a failed purchase even when payment succeeded.

The design must optimize for a tourist context: outdoor usage, limited attention, unstable data connection, and desire for immediate payoff.

---

## 3. Goals And Non-Goals

### Goals

- Let the buyer understand within the first viewport that the guides are ready now.
- Show each purchased guide as its own actionable item.
- Reduce the path from payment success to playback to one tap.
- Keep the current token-based secure access model intact.
- Preserve email as a backup path.

### Non-goals

- Re-architecting audio delivery.
- Replacing the canonical access page.
- Introducing account creation, login, or dashboard concepts.
- Adding autoplay behavior on the success page.

---

## 4. Recommended Approach

Recommended approach: **turn `thanks.astro` into an immediate post-purchase guide hub, with one card per purchased guide and a direct "Listen now" action per card.**

This keeps the system low-risk because it reuses the existing primitives:

- Stripe `session_id` validation
- metadata-derived purchased guide slugs
- access token generation
- existing `/access/[token]` private player page

Instead of a single "open my guide" CTA, the page should render purchased guides explicitly and link each guide to the correct private destination using a fragment such as `#guide-slug`.

---

## 5. UX Structure

The success page should contain four blocks, in this order:

1. **Purchase confirmation**
`Purchase complete. Your guides are ready.`

2. **Immediate reassurance**
`Your guides are ready right now. Open any guide below. We also sent the link by email as backup.`

3. **Purchased guides list**
One card per guide with:
- cover image
- localized title
- localized subtitle
- duration
- language reassurance
- primary CTA: `Listen now`

4. **Secondary support block**
- buyer email confirmation when available
- reminder that email is only backup
- recovery/support link for unusual cases

What should not appear as primary UX:

- a homepage CTA
- a generic single access link when multiple guides exist
- copy that implies the user must leave the browser and check mail

---

## 6. Interaction Model

### Primary flow

1. Stripe redirects to `thanks?session_id=...`
2. The page retrieves the session server-side.
3. If `payment_status === "paid"` and guide slugs exist:
- generate the same access token already used today
- resolve purchased guide content entries
- render one card per guide
4. Each card CTA links directly to the private access page anchored to the correct guide section:
`/access/{token}?lang={lang}#<guide-slug>`

### Why this is the first implementation step

This removes most friction without duplicating the player on the success page. It gives immediate guide-specific actions while keeping the existing private player page as the canonical playback environment.

### Future optimization

If later needed, the success page can embed the same player directly and become a full listening surface. That should be treated as a follow-up iteration, not required for this improvement.

---

## 7. Content And Tone

Copy should be short, confidence-building, and operational:

- emphasize readiness, not process
- mention email as backup, not instruction
- avoid vague language like "you will receive"
- avoid making the user infer that one token unlocks multiple guides

If only one guide was purchased, the card can be visually dominant. If multiple guides were purchased, the list should still show clear, distinct actions for each guide without collapsing into a single bundle-level CTA.

---

## 8. Error Handling

### Session missing or invalid

Do not promise immediate access. Show a neutral recovery state:

- `We are preparing your access.`
- support contact
- recovery link

### Session found but not paid

Show a non-alarming state explaining that payment confirmation is still pending and invite the user to retry shortly.

### Stripe lookup failure

Show a safe fallback state with:

- no false unlock promise
- clear support/recovery path
- reassurance that email backup may still arrive

The page must never show guide CTAs unless access is actually confirmed.

---

## 9. Technical Design

### Existing parts to reuse

- `src/pages/thanks.astro` for session lookup and token generation
- `src/pages/access/[token].astro` as canonical listening page
- `guide-localization.ts` helpers for localized title, subtitle, and duration
- current Stripe metadata: `guide_slugs`, `lang`, `partner_id`

### Required page changes

`thanks.astro` should:

- fetch matching guide entries from the content collection
- localize the page based on metadata language
- render a guide card list instead of a single abstract CTA
- generate one direct guide-specific link per purchased guide
- downgrade the email message to secondary UI

### Access page dependency

`access/[token].astro` should expose stable anchor targets per guide section using the guide slug as DOM id. Without that, guide-specific deep links from the success page cannot land precisely on the intended guide.

---

## 10. Testing Requirements

Minimum verification:

- paid purchase with 1 guide
- paid purchase with 3 guides
- paid purchase with 6 guides
- paid purchase in `it`, `en`, `de`
- refresh on success page after redirect
- deep link from success page to anchored guide on access page
- invalid or missing `session_id`

Mobile verification should prioritize first-viewport clarity and one-handed use.

---

## 11. Rollout Recommendation

Ship in one focused pass:

1. update success-page layout and copy
2. render purchased guide cards
3. add deep links to anchored guide sections
4. keep email as backup only

This is a high-leverage conversion protection change because it acts after payment intent is already strongest and removes the user's final moment of doubt.
