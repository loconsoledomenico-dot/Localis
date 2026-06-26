# Commissioni agente di commercio — design

**Data:** 2026-06-26
**Stato:** approvato (rev. 2 dopo scoperta sistema esistente), pronto per il piano

## Problema

Antonello (agente di commercio) distribuisce QR e procura partner, lavorando a
percentuale sul venduto. Per i partner che porta lui serve un secondo livello di
attribuzione e di conteggio commissioni, oggi assente.

## Decisioni

| Parametro | Valore |
|---|---|
| Split | Il 25% rev-share esistente si divide: **10% al partner + 15% ad Antonello**. Costo Localis invariato. |
| Durata 15% agente | A vita, finché il partner è attivo. Nessuna scadenza da tracciare. |
| Numero agenti | Uno solo (Antonello). |
| Base di calcolo | Lordo (`amount_total` Stripe). |
| Partner esistenti | I 9 live restano al 25%. Solo i nuovi di Antonello vanno sul tier 10/15. |
| Pagamento | Manuale (ledger payout esistente). Niente Stripe Connect automatico ora. |

## Scoperta che ha cambiato il disegno (rev. 2)

Il conteggio non era "flat 25% in un posto solo". In realtà:

1. **Esiste già `commission_rate` per partner** nello schema ([content.config.ts:103](../../../src/content.config.ts#L103), default 0.25). La pagina statement partner già lo legge per l'etichetta.
2. **Il 25% è hardcoded in DUE lettori Stripe** che ignorano quel campo:
   [partner-report.py:33](../../../scripts/partner-report.py#L33) (report CLI) e
   [referral.ts:46](../../../src/lib/referral.ts#L46) (alimenta la dashboard `/admin/referral`).
3. **Bug latente in statement.astro:** l'header mostra `commission_rate` (es. 10%) ma la
   colonna "Tua quota" usa `payout_due` calcolato al 25%. Mettere il rate dentro `referral.ts`
   raddrizza tutti i consumatori insieme.

## Approccio: scheda `.mdx` come fonte unica di verità

- Il **10% del partner** = `commission_rate: 0.10` sulla sua scheda `.mdx` (campo già esistente).
- L'**attribuzione all'agente** = nuovo campo schema `agent: z.string().optional()` (valore `"antonello"`).
- Il **15% dell'agente** = costante condivisa `AGENT_COMMISSION_RATE = 0.15` (TS) / `AGENT_RATE = 0.15` (Python),
  applicata quando `agent` è valorizzato. Invariante operativa: per i partner di Antonello si imposta
  `commission_rate: 0.10` + `agent: antonello` → 10 + 15 = 25.
- I due lettori Stripe (Python + `referral.ts`) leggono rate + agent dalla scheda e calcolano lo split.

## Componenti

### TS

1. **`src/content.config.ts`** — aggiungere `agent: z.string().optional()` allo schema partner.
2. **`src/lib/partner-rates.ts`** (nuovo) — `interface PartnerRate { commission_rate: number; agent: string | null }`
   + `loadPartnerRates(): Promise<Map<string, PartnerRate>>` via `getCollection('partners')`.
3. **`src/lib/referral.ts`**:
   - costante esportata `AGENT_COMMISSION_RATE = 0.15`;
   - funzione pura `splitCommission(grossCents, commissionRate, hasAgent, agentRate)` → `{ partner, agent }` (floor);
   - `PartnerSale` + `agent: string | null`, `agent_payout: number`;
   - `PartnerSummary` + `agent: string | null`, `agent_payout_total: number`;
   - `fetchPartnerSales(createdAfter?, rates?)`: `rates` opzionale (default Map vuota = 25% per tutti, retro-compatibile); per ogni vendita usa rate+agent dalla mappa;
   - `groupByPartner` aggrega anche `agent_payout_total`.
4. **`src/pages/admin/referral.astro`** — carica `loadPartnerRates()`, lo passa a `fetchPartnerSales`;
   aggiunge KPI **"Da pagare ad Antonello (15%)"** + colonna quota agente nel riepilogo.
5. **`src/pages/partner/[slug]/statement.astro`** — passa `rates` a `fetchPartnerSales` così
   `payout_due` rispetta il `commission_rate` reale (fix del bug latente). Il partner **non** vede la quota agente.

### Python

6. **`scripts/partner-report.py`**:
   - parser frontmatter `.mdx` partner → mappa `slug → {commission_rate, agent}` (parse riga `key: value`, niente dipendenze nuove);
   - costante `AGENT_RATE = 0.15`; per vendita: `partner_payout = gross*rate`, `agent_payout = gross*0.15 if agent else 0`;
   - riepilogo: colonna `rate` per partner + riga **"Da pagare ad Antonello (15%): X€"**;
   - CSV: colonne `rate`, `agent`, `agent_payout_eur`.

### Dati / doc

7. **`marketing/partners-registry.md`** — fix nota "25% del netto" → "25% del lordo"; sezione "Tier agente (Antonello)"
   con la regola operativa (`commission_rate: 0.10` + `agent: antonello` sulla scheda).
8. **Assegnazione reale**: i partner di Antonello si marcano impostando i due campi sulla loro `.mdx`.
   Oggi nessuno esiste ancora → solo doc, nessun dato hardcoded.

## Fuori scope

UI nuova, database, Stripe Connect automatico, multi-agente, scadenza temporale del 15%,
agente nel ledger payout (pagamento agente resta fuori dal registro pagamenti partner).

## Verifica

- TS: `pnpm check` pulito + `pnpm test` (nuovi unit test su `splitCommission`).
- Python: test su `split_commission` + parser frontmatter; run `partner-report.py` con un partner di prova
  marcato (`commission_rate 0.10` + `agent antonello`) e controllo split 10/15; partner non-agente restano 25%.
- `pnpm build` (pagine `/admin/referral` e statement toccate).
