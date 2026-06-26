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
