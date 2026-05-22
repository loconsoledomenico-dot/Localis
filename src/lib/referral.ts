import { getStripe } from './stripe';

export interface PartnerSale {
  session_id: string;
  created: Date;
  partner_id: string;
  product: string;
  amount_total: number;   // cents gross
  amount_net: number;     // cents after Stripe fee estimate
  payout_due: number;     // cents (25% of gross)
  currency: string;
  customer_email: string | null;
}

export interface PartnerSummary {
  partner_id: string;
  sales_count: number;
  gross_total: number;  // cents
  payout_total: number; // cents (25%)
  sales: PartnerSale[];
}

/**
 * Fetch all completed Stripe checkout sessions that have a partner_id in metadata.
 * Paginates through all sessions (no limit other than created_after if passed).
 */
export async function fetchPartnerSales(createdAfter?: Date): Promise<PartnerSale[]> {
  const stripe = getStripe();
  const sales: PartnerSale[] = [];

  const params: Parameters<typeof stripe.checkout.sessions.list>[0] = {
    limit: 100,
    expand: ['data.payment_intent'],
  };
  if (createdAfter) {
    params.created = { gte: Math.floor(createdAfter.getTime() / 1000) };
  }

  for await (const session of stripe.checkout.sessions.list(params)) {
    // Only paid sessions with a partner attribution
    if (session.payment_status !== 'paid') continue;
    const partner_id = session.metadata?.partner_id;
    if (!partner_id) continue;

    const gross = session.amount_total ?? 0;
    const payout = Math.floor(gross * 0.25);

    sales.push({
      session_id: session.id,
      created: new Date(session.created * 1000),
      partner_id,
      product: session.metadata?.product ?? 'unknown',
      amount_total: gross,
      amount_net: gross, // net calculation not critical here
      payout_due: payout,
      currency: session.currency ?? 'eur',
      customer_email: session.customer_details?.email ?? null,
    });
  }

  return sales;
}

/**
 * Group sales by partner_id into summary rows.
 */
export function groupByPartner(sales: PartnerSale[]): PartnerSummary[] {
  const map = new Map<string, PartnerSummary>();

  for (const sale of sales) {
    const existing = map.get(sale.partner_id);
    if (existing) {
      existing.sales_count++;
      existing.gross_total += sale.amount_total;
      existing.payout_total += sale.payout_due;
      existing.sales.push(sale);
    } else {
      map.set(sale.partner_id, {
        partner_id: sale.partner_id,
        sales_count: 1,
        gross_total: sale.amount_total,
        payout_total: sale.payout_due,
        sales: [sale],
      });
    }
  }

  return [...map.values()].sort((a, b) => b.payout_total - a.payout_total);
}

export function formatEur(cents: number): string {
  return (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}
