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
