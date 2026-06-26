# Commissioni Agente — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere un secondo livello di commissioni — l'agente Antonello prende il 15% sul venduto dei partner che procura, mentre quel partner scende al 10% (split del 25% esistente) — con conteggio coerente nel report Python e nella dashboard admin.

**Architecture:** La scheda `.mdx` del partner è la fonte unica: `commission_rate: 0.10` (campo esistente) + nuovo campo `agent: "antonello"`. I due lettori Stripe (TS `referral.ts` → dashboard/statement, e `partner-report.py`) leggono rate+agent dalla scheda e calcolano lo split via una funzione pura. Il 15% agente è una costante condivisa applicata quando `agent` è valorizzato.

**Tech Stack:** Astro content collections, TypeScript, vitest; Python 3.14 + PyYAML + pytest; Stripe SDK.

---

## File Structure

- `src/lib/referral.ts` — MODIFICA: costante `AGENT_COMMISSION_RATE`, funzione pura `splitCommission`, campi agente su `PartnerSale`/`PartnerSummary`, `fetchPartnerSales(createdAfter?, rates?)`, aggregazione agente in `groupByPartner`.
- `src/lib/partner-rates.ts` — NUOVO: `PartnerRate` + `loadPartnerRates()` da content collection.
- `src/content.config.ts` — MODIFICA: campo `agent` nello schema partner.
- `src/pages/admin/referral.astro` — MODIFICA: carica rates, KPI + sezione commissioni agente.
- `src/pages/partner/[slug]/statement.astro` — MODIFICA: passa rates (fix bug header vs quota).
- `scripts/partner-report.py` — MODIFICA: legge frontmatter, split 10/15, riga agente, colonne CSV.
- `tests/unit/referral.test.ts` — NUOVO: test `splitCommission` + `groupByPartner`.
- `scripts/test_partner_report.py` — NUOVO: test `commission_eur` + `parse_frontmatter`.
- `marketing/partners-registry.md` — MODIFICA: fix nota lordo/netto + sezione tier agente.

---

## Task 1: Funzione pura split commissioni (TS)

**Files:**
- Modify: `src/lib/referral.ts`
- Test: `tests/unit/referral.test.ts`

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `tests/unit/referral.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { splitCommission, AGENT_COMMISSION_RATE } from '../../src/lib/referral';

describe('splitCommission', () => {
  it('partner senza agente: 25% al partner, 0 all\'agente', () => {
    expect(splitCommission(1000, 0.25, false)).toEqual({ partner: 250, agent: 0 });
  });

  it('partner con agente: 10% partner + 15% agente sul lordo', () => {
    expect(splitCommission(1000, 0.10, true)).toEqual({ partner: 100, agent: 150 });
  });

  it('arrotonda per difetto i centesimi frazionari', () => {
    // 999*0.10 = 99.9 -> 99 ; 999*0.15 = 149.85 -> 149
    expect(splitCommission(999, 0.10, true)).toEqual({ partner: 99, agent: 149 });
  });

  it('AGENT_COMMISSION_RATE è 15%', () => {
    expect(AGENT_COMMISSION_RATE).toBe(0.15);
  });
});
```

- [ ] **Step 2: Esegui il test, deve fallire**

Run: `pnpm test -- referral`
Expected: FAIL — `splitCommission`/`AGENT_COMMISSION_RATE` non esportati.

- [ ] **Step 3: Implementa il minimo**

In `src/lib/referral.ts`, in cima (dopo `import { getStripe }`):

```ts
export const AGENT_COMMISSION_RATE = 0.15;

/** Split del lordo (cents) tra partner e agente. Floor sui centesimi. */
export function splitCommission(
  grossCents: number,
  commissionRate: number,
  hasAgent: boolean,
  agentRate: number = AGENT_COMMISSION_RATE,
): { partner: number; agent: number } {
  return {
    partner: Math.floor(grossCents * commissionRate),
    agent: hasAgent ? Math.floor(grossCents * agentRate) : 0,
  };
}
```

- [ ] **Step 4: Esegui il test, deve passare**

Run: `pnpm test -- referral`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/referral.ts tests/unit/referral.test.ts
git commit -m "feat(referral): splitCommission pura + AGENT_COMMISSION_RATE"
```

---

## Task 2: Loader rate per-partner dalla content collection (TS)

**Files:**
- Create: `src/lib/partner-rates.ts`

> Modulo glue su `getCollection` (non unit-testabile senza astro:content); validato da `pnpm check` nel Task 9. Nessun test dedicato.

- [ ] **Step 1: Crea il file**

`src/lib/partner-rates.ts`:

```ts
import { getCollection } from 'astro:content';

export interface PartnerRate {
  commission_rate: number;
  agent: string | null;
}

/** Mappa slug → rate+agente, letta dalle schede partner (.mdx). Fonte unica di verità. */
export async function loadPartnerRates(): Promise<Map<string, PartnerRate>> {
  const partners = await getCollection('partners');
  const map = new Map<string, PartnerRate>();
  for (const p of partners) {
    map.set(p.data.slug, {
      commission_rate: p.data.commission_rate ?? 0.25,
      agent: p.data.agent ?? null,
    });
  }
  return map;
}
```

- [ ] **Step 2: Commit** (il `check` dei tipi avverrà nel Task 3, dopo aver aggiunto il campo schema)

```bash
git add src/lib/partner-rates.ts
git commit -m "feat(referral): loadPartnerRates da content collection"
```

---

## Task 3: Campo `agent` nello schema partner

**Files:**
- Modify: `src/content.config.ts:103`

- [ ] **Step 1: Aggiungi il campo**

In `src/content.config.ts`, schema `partners`, subito dopo la riga `commission_rate: z.number()...`:

```ts
    agent: z.string().optional(),
```

- [ ] **Step 2: Verifica i tipi**

Run: `pnpm check`
Expected: nessun errore. `p.data.agent` ora è tipato in `partner-rates.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts
git commit -m "feat(partners): campo schema agent (attribuzione agente di commercio)"
```

---

## Task 4: Wire rate+agente in referral.ts (interfacce, fetch, group)

**Files:**
- Modify: `src/lib/referral.ts`
- Test: `tests/unit/referral.test.ts`

- [ ] **Step 1: Aggiungi il test su groupByPartner (fallisce)**

Appendi a `tests/unit/referral.test.ts`:

```ts
import { groupByPartner, type PartnerSale } from '../../src/lib/referral';

function sale(partner_id: string, gross: number, payout: number, agent: string | null, agentPayout: number): PartnerSale {
  return {
    session_id: 's_' + partner_id + gross,
    created: new Date('2026-06-01T00:00:00Z'),
    partner_id,
    product: 'single',
    amount_total: gross,
    amount_net: gross,
    payout_due: payout,
    agent,
    agent_payout: agentPayout,
    currency: 'eur',
    customer_email: null,
  };
}

describe('groupByPartner', () => {
  it('aggrega payout partner e payout agente per partner', () => {
    const rows = groupByPartner([
      sale('antonello-bar', 1000, 100, 'antonello', 150),
      sale('antonello-bar', 2000, 200, 'antonello', 300),
      sale('vecchio-bar', 1000, 250, null, 0),
    ]);
    const ant = rows.find((r) => r.partner_id === 'antonello-bar')!;
    expect(ant.payout_total).toBe(300);
    expect(ant.agent_payout_total).toBe(450);
    expect(ant.agent).toBe('antonello');
    const old = rows.find((r) => r.partner_id === 'vecchio-bar')!;
    expect(old.agent_payout_total).toBe(0);
    expect(old.agent).toBeNull();
  });
});
```

- [ ] **Step 2: Esegui, deve fallire**

Run: `pnpm test -- referral`
Expected: FAIL — `PartnerSale` non ha `agent`/`agent_payout`; `PartnerSummary` non ha `agent_payout_total`.

- [ ] **Step 3: Aggiorna interfacce e funzioni**

In `src/lib/referral.ts`:

(a) `import type { PartnerRate } from './partner-rates';` in cima (type-only: nessun runtime dep su astro:content nei test).

(b) Aggiungi a `PartnerSale` (dopo `payout_due`):

```ts
  agent: string | null;
  agent_payout: number;  // cents
```

(c) Aggiungi a `PartnerSummary` (dopo `payout_total`):

```ts
  agent: string | null;
  agent_payout_total: number; // cents
```

(d) Cambia firma e corpo di `fetchPartnerSales`:

```ts
export async function fetchPartnerSales(
  createdAfter?: Date,
  rates?: Map<string, PartnerRate>,
): Promise<PartnerSale[]> {
```

Dentro al loop, sostituisci il blocco `const gross = ...; const payout = Math.floor(gross * 0.25);` e l'oggetto `sales.push({...})` con:

```ts
    const gross = session.amount_total ?? 0;
    const rate = rates?.get(partner_id);
    const commissionRate = rate?.commission_rate ?? 0.25;
    const agent = rate?.agent ?? null;
    const { partner: payout, agent: agentPayout } = splitCommission(gross, commissionRate, agent !== null);

    sales.push({
      session_id: session.id,
      created: new Date(session.created * 1000),
      partner_id,
      product: session.metadata?.product ?? 'unknown',
      amount_total: gross,
      amount_net: gross,
      payout_due: payout,
      agent,
      agent_payout: agentPayout,
      currency: session.currency ?? 'eur',
      customer_email: session.customer_details?.email ?? null,
    });
```

(e) In `groupByPartner`, nel ramo `if (existing)` aggiungi dopo `existing.payout_total += sale.payout_due;`:

```ts
      existing.agent_payout_total += sale.agent_payout;
```

e nel ramo `else` (oggetto `map.set`), dopo `payout_total: sale.payout_due,`:

```ts
        agent: sale.agent,
        agent_payout_total: sale.agent_payout,
```

- [ ] **Step 4: Esegui, deve passare**

Run: `pnpm test -- referral`
Expected: PASS (tutti i test di Task 1 + Task 4).

- [ ] **Step 5: Commit**

```bash
git add src/lib/referral.ts tests/unit/referral.test.ts
git commit -m "feat(referral): rate per-partner + payout agente in fetch/group"
```

---

## Task 5: Dashboard admin — KPI e sezione commissioni agente

**Files:**
- Modify: `src/pages/admin/referral.astro`

- [ ] **Step 1: Carica i rates e passali a fetch**

In `src/pages/admin/referral.astro`, riga 2, aggiungi import:

```ts
import { loadPartnerRates } from '../../lib/partner-rates';
```

Sostituisci (dentro il `try`, riga ~106) `sales = await fetchPartnerSales(createdAfter);` con:

```ts
  const rates = await loadPartnerRates();
  sales = await fetchPartnerSales(createdAfter, rates);
```

- [ ] **Step 2: Calcola i totali agente**

Dopo `const totalPayout = summaries.reduce((s, p) => s + p.payout_total, 0);` (riga ~113) aggiungi:

```ts
const agentSummaries = summaries.filter((p) => p.agent);
const totalAgentPayout = agentSummaries.reduce((s, p) => s + p.agent_payout_total, 0);
```

- [ ] **Step 3: Aggiungi la KPI card**

Nel blocco `.kpi-row`, dopo la card "Maturato (25%)" (dopo la sua `</div>` di chiusura, riga ~262), aggiungi:

```astro
    <div class="kpi">
      <div class="kpi-label">Agente (15%)</div>
      <div class="kpi-value">{formatEur(totalAgentPayout)}</div>
    </div>
```

- [ ] **Step 4: Aggiungi la sezione "Commissioni agente"**

Subito dopo la chiusura `</section>` del "Riepilogo per partner" (riga ~417, prima della section "Tutte le vendite referral"), inserisci:

```astro
  <!-- Commissioni agente -->
  {agentSummaries.length > 0 && (
    <section>
      <h2>Commissioni agente (15%)</h2>
      <table>
        <thead>
          <tr>
            <th>Agente</th>
            <th>Partner</th>
            <th>Vendite</th>
            <th>Revenue lordo</th>
            <th>Da pagare (15%)</th>
          </tr>
        </thead>
        <tbody>
          {agentSummaries.map((p) => (
            <tr>
              <td>{p.agent}</td>
              <td><span class="tag">{p.partner_id}</span></td>
              <td>{p.sales_count}</td>
              <td>{formatEur(p.gross_total)}</td>
              <td class="payout">{formatEur(p.agent_payout_total)}</td>
            </tr>
          ))}
          <tr>
            <td colspan="4" style="text-align:right;font-weight:700">Totale agente</td>
            <td class="payout" style="font-weight:700">{formatEur(totalAgentPayout)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  )}
```

- [ ] **Step 5: Verifica build della pagina**

Run: `pnpm check`
Expected: nessun errore di tipo.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/referral.astro
git commit -m "feat(admin): KPI e sezione commissioni agente nella dashboard referral"
```

---

## Task 6: Statement partner — rispetta il commission_rate reale

**Files:**
- Modify: `src/pages/partner/[slug]/statement.astro`

> Fix del bug latente: header mostra `commission_rate` ma la quota usava il 25% hardcoded. Il partner NON vede la quota agente.

- [ ] **Step 1: Importa e passa i rates**

In `src/pages/partner/[slug]/statement.astro`, riga 3, aggiungi a fianco degli import esistenti:

```ts
import { loadPartnerRates } from '../../../lib/partner-rates';
```

Sostituisci (riga ~30) `const allSales = await fetchPartnerSales();` con:

```ts
const rates = await loadPartnerRates();
const allSales = await fetchPartnerSales(undefined, rates);
```

- [ ] **Step 2: Verifica i tipi**

Run: `pnpm check`
Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add src/pages/partner/[slug]/statement.astro
git commit -m "fix(statement): quota partner usa il commission_rate reale, non 25% fisso"
```

---

## Task 7: Helper Python — commission_eur + parser frontmatter

**Files:**
- Modify: `scripts/partner-report.py`
- Test: `scripts/test_partner_report.py`

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `scripts/test_partner_report.py`:

```python
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "partner_report", Path(__file__).resolve().parent / "partner-report.py"
)
pr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pr)


def test_commission_eur_partner_standard():
    assert pr.commission_eur(1000, 0.25) == 2.50


def test_commission_eur_partner_agente():
    assert pr.commission_eur(1000, 0.10) == 1.00


def test_commission_eur_quota_agente():
    assert pr.commission_eur(1000, pr.AGENT_RATE) == 1.50


def test_parse_frontmatter_legge_rate_e_agent():
    text = (
        "---\n"
        "slug: antonello-bar\n"
        'display_name: "Bar di prova"\n'
        "commission_rate: 0.10\n"
        "agent: antonello\n"
        "status: active\n"
        "---\n\n# corpo\n"
    )
    fm = pr.parse_frontmatter(text)
    assert fm["slug"] == "antonello-bar"
    assert float(fm["commission_rate"]) == 0.10
    assert fm["agent"] == "antonello"


def test_parse_frontmatter_agent_assente():
    text = "---\nslug: vecchio-bar\ncommission_rate: 0.25\nstatus: active\n---\n"
    fm = pr.parse_frontmatter(text)
    assert "agent" not in fm
```

- [ ] **Step 2: Esegui, deve fallire**

Run: `python -m pytest scripts/test_partner_report.py -v`
Expected: FAIL — `commission_eur`/`AGENT_RATE`/`parse_frontmatter` non definiti.

- [ ] **Step 3: Implementa gli helper**

In `scripts/partner-report.py`, sostituisci la riga `COMMISSION_RATE = 0.25` con:

```python
import yaml

DEFAULT_COMMISSION_RATE = 0.25
AGENT_RATE = 0.15
PARTNERS_DIR = Path(__file__).resolve().parent.parent / 'src' / 'content' / 'partners'


def commission_eur(gross_cents: int, rate: float) -> float:
    """Quota in euro su un lordo in cents, arrotondata a 2 decimali."""
    return round(gross_cents * rate / 100, 2)


def parse_frontmatter(text: str) -> dict:
    """Estrae il blocco YAML tra i primi due '---' di una scheda .mdx."""
    if not text.startswith('---'):
        return {}
    parts = text.split('---', 2)
    if len(parts) < 3:
        return {}
    data = yaml.safe_load(parts[1]) or {}
    return data if isinstance(data, dict) else {}


def load_partner_rates() -> dict[str, dict]:
    """slug -> {'rate': float, 'agent': str|None} dalle schede partner."""
    rates: dict[str, dict] = {}
    if not PARTNERS_DIR.is_dir():
        return rates
    for path in PARTNERS_DIR.glob('*.mdx'):
        fm = parse_frontmatter(path.read_text(encoding='utf-8'))
        slug = fm.get('slug')
        if not slug:
            continue
        rates[str(slug)] = {
            'rate': float(fm.get('commission_rate', DEFAULT_COMMISSION_RATE)),
            'agent': fm.get('agent'),
        }
    return rates
```

- [ ] **Step 4: Esegui, deve passare**

Run: `python -m pytest scripts/test_partner_report.py -v`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add scripts/partner-report.py scripts/test_partner_report.py
git commit -m "feat(report): helper commission_eur + parser frontmatter partner"
```

---

## Task 8: partner-report.py — split 10/15 nel report e nel CSV

**Files:**
- Modify: `scripts/partner-report.py`

- [ ] **Step 1: Applica rate+agente in fetch_sessions**

In `fetch_sessions`, prima del loop, dopo `sessions = []` aggiungi:

```python
    partner_rates = load_partner_rates()
```

Sostituisci il blocco che costruisce il dict della sessione (da `gross = session.get('amount_total') or 0` fino alla `})`) con:

```python
        gross = session.get('amount_total') or 0
        info = partner_rates.get(pid, {})
        rate = info.get('rate', DEFAULT_COMMISSION_RATE)
        agent = info.get('agent')
        sessions.append({
            'session_id': session['id'],
            'created': datetime.fromtimestamp(session['created'], tz=timezone.utc),
            'partner_id': pid,
            'product': meta.get('product', 'unknown'),
            'gross_eur': gross / 100,
            'rate': rate,
            'payout_eur': commission_eur(gross, rate),
            'agent': agent or '',
            'agent_payout_eur': commission_eur(gross, AGENT_RATE) if agent else 0.0,
            'currency': session.get('currency', 'eur').upper(),
            'customer_email': (session.get('customer_details') or {}).get('email') or '',
        })
```

- [ ] **Step 2: Mostra rate e totale agente nel riepilogo**

In `print_summary`, nel loop di aggregazione `for s in sessions:` aggiungi dentro il blocco (dopo `partners[pid]['payout'] += s['payout_eur']`):

```python
        partners[pid]['rate'] = s['rate']
        partners[pid]['agent'] = s['agent']
        partners[pid]['agent_payout'] = partners[pid].get('agent_payout', 0.0) + s['agent_payout_eur']
```

e nell'inizializzazione `partners[pid] = {...}` aggiungi le chiavi: `'rate': 0.25, 'agent': '', 'agent_payout': 0.0`.

Sostituisci la riga di stampa per-partner:

```python
        print(f'{pid:<25} {data["count"]:>8} {data["gross"]:>11.2f}€ {data["payout"]:>11.2f}€')
```

con (mostra la percentuale applicata):

```python
        rate_pct = f'{round(data["rate"] * 100)}%'
        print(f'{pid:<25} {rate_pct:>5} {data["count"]:>6} {data["gross"]:>11.2f}€ {data["payout"]:>11.2f}€')
```

e aggiorna l'header tabella (la riga `print(f'{"Partner":<25} ...')`) in:

```python
    print(f'{"Partner":<25} {"Rate":>5} {"Vend":>6} {"Lordo":>12} {"Da pagare":>12}')
```

Dopo il blocco che stampa `Importo da pagare ai partner`, aggiungi il totale agente:

```python
    total_agent = sum(p.get('agent_payout', 0.0) for p in partners.values())
    if total_agent > 0:
        agents = sorted({p['agent'] for p in partners.values() if p.get('agent')})
        label = ', '.join(agents) if agents else 'agente'
        print(f'  Da pagare all\'agente ({label}, 15%): {total_agent:.2f}€')
```

- [ ] **Step 3: Aggiungi le colonne al CSV**

In `save_csv`, sostituisci la lista `fields` con:

```python
    fields = ['session_id', 'created', 'partner_id', 'product', 'gross_eur', 'rate', 'payout_eur', 'agent', 'agent_payout_eur', 'currency', 'customer_email']
```

- [ ] **Step 4: Verifica che non si rompa (smoke, senza Stripe)**

Run: `python -m pytest scripts/test_partner_report.py -v`
Expected: PASS (gli helper restano verdi; import del modulo ok con le modifiche).

- [ ] **Step 5: Commit**

```bash
git add scripts/partner-report.py
git commit -m "feat(report): split 10/15 partner-agente nel report e nel CSV"
```

---

## Task 9: Documentazione registry + verifica finale

**Files:**
- Modify: `marketing/partners-registry.md`

- [ ] **Step 1: Fix nota lordo/netto + sezione tier agente**

In `marketing/partners-registry.md`, riga 8, sostituisci:

```
**Revenue share:** 25% del netto su ogni acquisto attribuito, impostato in `src/pages/api/checkout.ts`.
```

con:

```
**Revenue share:** 25% del **lordo** su ogni acquisto attribuito (`commission_rate` nella scheda partner, default 0.25; il calcolo lavora sul lordo Stripe).

**Tier agente (Antonello):** per i partner procurati dall'agente di commercio si imposta sulla scheda `.mdx` `commission_rate: 0.10` + `agent: antonello`. Lo split diventa 10% al partner + 15% all'agente (totale invariato 25%). Il 15% appare nella dashboard `/admin/referral` (sezione "Commissioni agente") e nel `partner-report.py`. Pagamento agente manuale, fuori dal ledger payout partner.
```

- [ ] **Step 2: Commit**

```bash
git add marketing/partners-registry.md
git commit -m "docs(partners): tier agente Antonello + fix nota lordo/netto"
```

- [ ] **Step 3: Verifica finale completa**

Run: `pnpm check`
Expected: 0 errori, 0 warning bloccanti.

Run: `pnpm test`
Expected: tutti verdi, inclusi i nuovi `tests/unit/referral.test.ts`.

Run: `python -m pytest scripts/test_partner_report.py -v`
Expected: 5 PASS.

Run: `pnpm build`
Expected: build OK, pagine `/admin/referral` e `/partner/[slug]/statement` generate senza errori.

- [ ] **Step 4: Smoke test manuale dello split (facoltativo, richiede una scheda di prova)**

Crea una scheda partner di prova marcata (`commission_rate: 0.10`, `agent: antonello`) solo se vuoi vedere i numeri reali; altrimenti i test coprono già la matematica. NON serve push: il deploy parte solo su push esplicito (Netlify).

---

## Self-Review (compilato in fase di scrittura)

- **Copertura spec:** schema `agent` (T3), 10% via commission_rate (T6 lo fa rispettare), 15% agente costante (T1), report Python (T7-T8), dashboard (T5), statement fix (T6), registry (T9). ✓
- **Nessun placeholder:** ogni step ha codice/comando concreti. ✓
- **Coerenza tipi/nomi:** `splitCommission`, `AGENT_COMMISSION_RATE`, `PartnerRate`, `loadPartnerRates`, `agent_payout`/`agent_payout_total`, `commission_eur`, `AGENT_RATE`, `parse_frontmatter`, `load_partner_rates` usati identici tra task. ✓
- **Push:** mai automatico — deploy Netlify solo su push esplicito dell'utente.
