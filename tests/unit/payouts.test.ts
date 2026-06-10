import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPayouts,
  addPayout,
  deletePayout,
  sumPayouts,
  parseEurToCents,
  PAYOUT_THRESHOLD_CENTS,
} from '../../src/lib/payouts';
import { _resetKvMemory } from '../../src/lib/kv';

describe('parseEurToCents', () => {
  it('parses comma decimals (formato italiano)', () => {
    expect(parseEurToCents('12,50')).toBe(1250);
  });

  it('parses dot decimals', () => {
    expect(parseEurToCents('12.50')).toBe(1250);
  });

  it('parses integers and strips € and spaces', () => {
    expect(parseEurToCents('€ 25')).toBe(2500);
  });

  it('rejects garbage and negative-like input', () => {
    expect(parseEurToCents('abc')).toBeNull();
    expect(parseEurToCents('-5')).toBeNull();
    expect(parseEurToCents('1,234')).toBeNull();
    expect(parseEurToCents('')).toBeNull();
  });
});

describe('payout ledger', () => {
  beforeEach(() => {
    _resetKvMemory();
  });

  it('starts empty', async () => {
    expect(await getPayouts('london-bar')).toEqual([]);
  });

  it('records a payout and reads it back', async () => {
    const rec = await addPayout('london-bar', {
      date: '2026-06-10',
      amount_cents: 2500,
      method: 'bonifico',
      note: 'primo pagamento',
    });
    expect(rec.id).toBeTruthy();

    const all = await getPayouts('london-bar');
    expect(all).toHaveLength(1);
    expect(all[0].amount_cents).toBe(2500);
    expect(all[0].note).toBe('primo pagamento');
  });

  it('keeps ledgers separate per partner', async () => {
    await addPayout('partner-a', { date: '2026-06-01', amount_cents: 1000, method: 'contanti' });
    await addPayout('partner-b', { date: '2026-06-02', amount_cents: 2000, method: 'bonifico' });

    expect(sumPayouts(await getPayouts('partner-a'))).toBe(1000);
    expect(sumPayouts(await getPayouts('partner-b'))).toBe(2000);
  });

  it('deletes a payout by id (e ignora id inesistenti)', async () => {
    const rec = await addPayout('partner-a', { date: '2026-06-01', amount_cents: 1000, method: 'bonifico' });
    expect(await deletePayout('partner-a', 'id-che-non-esiste')).toBe(false);
    expect(await deletePayout('partner-a', rec.id)).toBe(true);
    expect(await getPayouts('partner-a')).toEqual([]);
  });

  it('rejects invalid amounts and dates', async () => {
    await expect(addPayout('p', { date: '2026-06-01', amount_cents: 0, method: 'x' })).rejects.toThrow();
    await expect(addPayout('p', { date: '2026-06-01', amount_cents: 10.5, method: 'x' })).rejects.toThrow();
    await expect(addPayout('p', { date: '10/06/2026', amount_cents: 100, method: 'x' })).rejects.toThrow();
  });

  it('threshold is €25', () => {
    expect(PAYOUT_THRESHOLD_CENTS).toBe(2500);
  });
});
