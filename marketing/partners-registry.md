# Localis - Partner QR Registry

Master ledger dei partner referral. Aggiornare manualmente. Numeri da GA4/PostHog con parametro `partner_id` + Stripe con metadata `partner_id`.

**Pattern URL QR:** `https://localis.guide/p/<slug>`
**Vincoli slug:** lowercase, 3-41 caratteri, regex `[a-z0-9][a-z0-9-]{2,40}`; no underscore, no spazi, no maiuscole.
**Cookie referral:** 30 giorni.
**Revenue share:** 25% del **lordo** su ogni acquisto attribuito (`commission_rate` nella scheda partner, default 0.25; il calcolo lavora sul lordo Stripe).

**Tier agente (Antonello):** per i partner procurati dall'agente di commercio si imposta sulla scheda `.mdx` `commission_rate: 0.10` + `agent: antonello`. Lo split diventa 10% al partner + 15% all'agente (totale invariato 25%). Il 15% appare nella dashboard `/admin/referral` (sezione "Commissioni agente") e nel `partner-report.py`. Pagamento agente manuale, fuori dal ledger payout partner.

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
| 009 | `masseria-dirupo-noci` | Masseria Dirupo | Zona F 46, 70015 Noci (BA) | Struttura ricettiva + area camper | da definire | info@masseriadirupo.it | 2026-06-22 | [PNG](qr-codes/masseria-dirupo-noci.png) | Azienda Agricola Fratelli Lippolis (Giuseppe Lippolis). Valle d'Itria. P.IVA 07031080729 · +39 329 74 64 564. QR in camera / area camper. |
| 010 | `biorussi-agriturismo` | Biorussi Agriturismo | Contrada Macchiarotonda, 71010 Carpino (FG) | Agriturismo | da definire | info@biorussi.com | 2026-06-29 | Card neutra `HBV9D2` (`/q/hbv9d2`) | Società Agricola Biorussi srl. Gargano, zona lago di Varano. "Biologico per tradizione". P.IVA 03703600712 · +39 0884 596765 / 348 8895360 · www.biorussi.com. |
| 011 | `villaggio-costa-ripa` | Villaggio Costa Ripa | Contrada Ripa, 71012 Rodi Garganico (FG) | Villaggio turistico | da definire | info@villaggiocostaripa.it | 2026-06-29 | Card neutra `L3EYN6` (`/q/l3eyn6`) | Gargano. CIN IT071043A100113788. QR in camera / reception. |
| 012 | `hotel-helios` | Hotel Helios | Via delle Meduse 57, 71012 Lido del Sole, Rodi Garganico (FG) | Hotel *** | da definire | prenotazionihotelhelios@gmail.com | 2026-06-29 | Card neutra `JL3Z46` (`/q/jl3z46`) | Gargano, Lido del Sole. P.IVA 04460630710 · CIN IT071043A100107823. QR in camera / reception. |
| 013 | `infopoint-rodi-garganico` | InfoPoint Rodi Garganico | Casa Comunale, 71012 Rodi Garganico (FG) | Info point | 1 desk | info@localis.guide | 2026-07-01 | Card neutra `MFSBPS` (`/q/mfsbps`) | InfoPoint Puglia Information del Comune di Rodi Garganico. Gargano. |

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
