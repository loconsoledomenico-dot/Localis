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
