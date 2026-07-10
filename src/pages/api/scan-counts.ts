// Lettura dei conteggi scansioni server-side (scritti dall'edge function
// scan-counter). Protetto da ADMIN_TOKEN. Uso:
//   /api/scan-counts?token=...&days=14
import type { APIRoute } from 'astro';
import { kvGetJSON } from '../../lib/kv';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token');
  const admin = import.meta.env.ADMIN_TOKEN;
  if (!admin || token !== admin) {
    return new Response('Unauthorized', { status: 401 });
  }

  const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days') || 30)));
  const byDay: Record<string, Record<string, number>> = {};
  const totals: Record<string, number> = {};
  const now = new Date();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    const day = d.toISOString().slice(0, 10);
    const rec = await kvGetJSON<Record<string, number>>('scan-counts', day);
    if (rec && Object.keys(rec).length) {
      byDay[day] = rec;
      for (const [k, v] of Object.entries(rec)) totals[k] = (totals[k] || 0) + v;
    }
  }

  const sortedTotals = Object.fromEntries(Object.entries(totals).sort((a, b) => b[1] - a[1]));
  return new Response(JSON.stringify({ days, totals: sortedTotals, byDay }, null, 2), {
    headers: { 'content-type': 'application/json' },
  });
};
