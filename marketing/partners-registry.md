# Localis · Partner QR Registry

Master ledger dei partner referral. Aggiornare manualmente. Numeri da GA4 (custom dimension `partner_id`) + Stripe (metadata `partner_id`).

**Pattern URL QR:** `https://localis.guide/?p=<slug>`
**Vincoli slug:** lowercase, 3-41 caratteri, regex `[a-z0-9][a-z0-9-]{2,40}` — no underscore, no spazi, no maiuscole.
**Cookie referral:** 30 giorni (chi clicca oggi, attribuito anche se acquista fra 3 settimane).
**Revenue share:** 25% del netto su ogni acquisto attribuito (impostato in `src/pages/api/checkout.ts`).

---

## Live partners

| # | Slug | Nome | Indirizzo | Tipo | Contatto | Consegnato | QR file | Note |
|---|---|---|---|---|---|---|---|---|
| 001 | `london-bar` | London Bar | Via Principe Amedeo, 148, Bari | Bar | — | 2026-05-21 | [london-bar.png](qr-codes/london-bar.png) | Primo partner. QR consegnato a mano. |

---

## Pending / contattati

| # | Slug | Nome | Indirizzo | Tipo | Contatto | Stato | Note |
|---|---|---|---|---|---|---|---|

---

## Risultati (aggiornare ogni 7 giorni)

Compilare dopo aver verificato GA4 → Esplorazioni → custom report con dimensione `Partner ID`.

| Partner | Periodo | Visitatori | Preview ascoltate | Checkout iniziati | Acquisti | Revenue lorda | Quota partner (25%) | CR visit→buy | Note |
|---|---|---|---|---|---|---|---|---|---|
| `london-bar` | 2026-05-21 → ... | — | — | — | — | — | — | — | Baseline da rilevare |

---

## Onboarding checklist (per ogni nuovo partner)

- [ ] Slug definito (regex `[a-z0-9][a-z0-9-]{2,40}`)
- [ ] QR generato in `marketing/qr-codes/<slug>.png` (script: vedi `scripts/generate-qr.py`)
- [ ] Stampato (consigliato: 8×8 cm fronte cassa / vetrina / menu)
- [ ] Consegnato di persona, breve pitch al gestore
- [ ] Riga aggiunta a tabella "Live partners" qui sopra
- [ ] (Opzionale) record creato in `src/content/partners/<slug>.mdx` se vuoi pagina dedicata `/p/<slug>`
- [ ] (Opzionale) Stripe Connect account collegato se vuoi versare quota automaticamente (oggi tracking-only, payout manuale)

---

## Note operative

- **GA4 attribuzione:** ogni evento (`page_view`, `preview_played`, `checkout_started`, `purchase_completed`) auto-attribuito via `partner_id`. Custom dimension da creare in Admin → Definizioni personalizzate (Event-scoped, parametro `partner_id`).
- **Stripe attribuzione:** `partner_id` salvato in `checkout.session.metadata.partner_id` → recuperabile post-fatto via Stripe Dashboard o webhook.
- **Cookie:** `lg_partner` 30 giorni, secondo cookie `lg_partner_ts` per timestamp. URL `?p=` ha priorità su cookie esistente.
