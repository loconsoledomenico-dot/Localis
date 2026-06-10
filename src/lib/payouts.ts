/**
 * Registro pagamenti partner (rev-share 25%).
 *
 * Le vendite e la quota maturata arrivano da Stripe (lib/referral.ts);
 * questo modulo registra i pagamenti effettuati a ciascun partner su
 * Netlify Blobs, così admin e statement possono mostrare il saldo reale:
 * saldo = maturato (Stripe) − pagato (questo registro).
 */
import { kvGetJSON, kvSetJSON } from './kv';

/** Sotto questa soglia il saldo si accumula e non viene pagato. */
export const PAYOUT_THRESHOLD_CENTS = 2500;

export interface PayoutRecord {
  id: string;
  /** Data valuta del pagamento, YYYY-MM-DD. */
  date: string;
  amount_cents: number;
  /** bonifico · contanti · compensazione · altro */
  method: string;
  note?: string;
  recorded_at: string;
}

const STORE = 'partner-payouts';

export async function getPayouts(partnerId: string): Promise<PayoutRecord[]> {
  const records = await kvGetJSON<PayoutRecord[]>(STORE, partnerId);
  return Array.isArray(records) ? records : [];
}

export async function addPayout(
  partnerId: string,
  input: { date: string; amount_cents: number; method: string; note?: string },
): Promise<PayoutRecord> {
  if (!Number.isInteger(input.amount_cents) || input.amount_cents <= 0) {
    throw new Error('amount_cents deve essere un intero positivo');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new Error('date deve essere nel formato YYYY-MM-DD');
  }
  const record: PayoutRecord = {
    id: crypto.randomUUID(),
    date: input.date,
    amount_cents: input.amount_cents,
    method: input.method.trim() || 'bonifico',
    note: input.note?.trim() || undefined,
    recorded_at: new Date().toISOString(),
  };
  const records = await getPayouts(partnerId);
  records.push(record);
  await kvSetJSON(STORE, partnerId, records);
  return record;
}

export async function deletePayout(partnerId: string, payoutId: string): Promise<boolean> {
  const records = await getPayouts(partnerId);
  const next = records.filter((r) => r.id !== payoutId);
  if (next.length === records.length) return false;
  await kvSetJSON(STORE, partnerId, next);
  return true;
}

export function sumPayouts(records: PayoutRecord[]): number {
  return records.reduce((s, r) => s + r.amount_cents, 0);
}

/** Converte un importo in EUR digitato a mano ("12,50" o "12.50") in centesimi. */
export function parseEurToCents(raw: string): number | null {
  const normalized = raw.trim().replace(/€|\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(parseFloat(normalized) * 100);
}
