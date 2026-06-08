# Localis - Partner QR Registry

Master ledger dei partner referral. Aggiornare manualmente. Numeri da GA4/PostHog con parametro `partner_id` + Stripe con metadata `partner_id`.

**Pattern URL QR:** `https://localis.guide/p/<slug>`
**Vincoli slug:** lowercase, 3-41 caratteri, regex `[a-z0-9][a-z0-9-]{2,40}`; no underscore, no spazi, no maiuscole.
**Cookie referral:** 30 giorni.
**Revenue share:** 25% del netto su ogni acquisto attribuito, impostato in `src/pages/api/checkout.ts`.

---

## Live partners

| # | Slug | Nome | Indirizzo | Tipo | Copie QR | Contatto | Consegnato | File | Note |
|---|---|---|---|---|---|---|---|---|---|
| 001 | `london-bar` | London Bar | Via Principe Amedeo, 148, Bari | Bar | 7 (1 bancone + 6 tavolini) | - | 2026-05-21 | [PNG](qr-codes/london-bar.png) | Stessa grafica QR replicata 7 volte. Stampa 8x8 cm consigliata. |
| 002 | `london-bar-bb` | London B&B | Principe152 / Le Chicche di Carola / Marchese 124, Bari | B&B | 5 camere | info@londonbarbari.it | 2026-05-22 | [PNG](qr-codes/london-bar-bb.png) | Analytics separata dal London Bar. |
| 003 | `paesaggi` | Paesaggi | Centro Bari | Negozio / vetrina | 1 gigante | info@paesaggibari.it | 2026-05-21 | [PNG](qr-codes/paesaggi.png) / [SVG](qr-codes/paesaggi.svg) | Vetrina format. SVG vettoriale per stampa grande. |
| 004 | `bluemarine-lido-sole` | Residence Bluemarine | Lido del Sole, Via delle Dalie 11, Rodi Garganico | Hotel/residence | 70 stanze | info@bluemarinevillage.it | 2026-05-25 | [PNG](qr-codes/bluemarine-lido-sole.png) | QR in camera / reception. |
| 005 | `giardino-lido-sole` | Il Giardino | Lido del Sole, Rodi Garganico | Hotel/ristorante | 28 stanze | info@giardino-lidosole.it | 2026-05-25 | [PNG](qr-codes/giardino-lido-sole.png) | QR in camera / reception. |
| 006 | `infopoint-bari` | InfoPoint Turistico Bari | Piazza del Ferrarese 29, Bari | Info point | 1 desk | info@localis.guide | 2026-06-08 | [PNG](qr-codes/infopoint-bari.png) | QR front desk Bari. |
| 007 | `casale-madre-ostuni` | Casale Madre | Ostuni | B&B | da definire | info@localis.guide | 2026-06-08 | [PNG](qr-codes/casale-madre-ostuni.png) | QR in camera / reception. |
| 008 | `mare-in-casa-polignano` | Mare in casa - Dimora Luxury | Polignano a Mare | B&B | da definire | info@localis.guide | 2026-06-08 | [PNG](qr-codes/mare-in-casa-polignano.png) | QR in camera / reception. |

---

## Pending / contattati

| # | Slug | Nome | Indirizzo | Tipo | Contatto | Stato | Note |
|---|---|---|---|---|---|---|---|

---

## Risultati

Aggiornare ogni 7 giorni dopo aver verificato GA4/PostHog con dimensione o proprieta `partner_id`.

| Partner | Periodo | Visitatori | Preview ascoltate | Checkout iniziati | Acquisti | Revenue lorda | Quota partner 25% | CR visit-buy | Note |
|---|---|---|---|---|---|---|---|---|---|
| `london-bar` | 2026-05-21 -> ... | - | - | - | - | - | - | - | Baseline da rilevare |
| `london-bar-bb` | 2026-05-22 -> ... | - | - | - | - | - | - | - | Camere B&B, separato dal bar |
| `paesaggi` | 2026-05-21 -> ... | - | - | - | - | - | - | - | Vetrina centro, alto passaggio pedoni |
| `bluemarine-lido-sole` | 2026-05-25 -> ... | - | - | - | - | - | - | - | Residence Gargano |
| `giardino-lido-sole` | 2026-05-25 -> ... | - | - | - | - | - | - | - | Hotel/ristorante Gargano |
| `infopoint-bari` | 2026-06-08 -> ... | - | - | - | - | - | - | - | Info point turistico Bari |
| `casale-madre-ostuni` | 2026-06-08 -> ... | - | - | - | - | - | - | - | Ostuni |
| `mare-in-casa-polignano` | 2026-06-08 -> ... | - | - | - | - | - | - | - | Polignano a Mare |

---

## Onboarding checklist

- [ ] Slug definito, regex `[a-z0-9][a-z0-9-]{2,40}`
- [ ] Record creato in `src/content/partners/<slug>.mdx`
- [ ] QR generato in `marketing/qr-codes/<slug>.png` con `python scripts/generate-qr.py <slug>`
- [ ] QR testato con scansione reale da telefono
- [ ] Stampato, consigliato minimo 8x8 cm fronte cassa / vetrina / menu / camera
- [ ] Consegnato di persona, breve pitch al gestore
- [ ] Riga aggiunta a "Live partners"
- [ ] Stripe Connect account collegato solo se si vuole automatizzare il payout; altrimenti tracking e payout manuale

---

## Note operative

- **GA4/PostHog:** gli eventi principali usano `partner_id`. L'evento standard per ingresso QR su landing partner e `qr_landing_viewed`.
- **Stripe:** `partner_id` viene salvato in `checkout.session.metadata.partner_id`.
- **Cookie:** `lg_partner` dura 30 giorni. `lg_partner_ts` e salvato in localStorage per timestamp. La landing `/p/<slug>` ha priorita su cookie esistente; `?p=` resta supportato per compatibilita storica.
