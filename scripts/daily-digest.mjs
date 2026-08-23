// Digest giornaliero: esegue private/digest-data.mjs, formatta il risultato e
// lo stampa (o lo manda via email con --send).
//
// Sostituisce gallery-outreach/daily_digest.py, che stava in C:\Dev e non esiste
// piu'. La raccolta dati resta in private/digest-data.mjs: qui c'e' solo la
// formattazione e l'invio.
//
//   node scripts/daily-digest.mjs            stampa il digest
//   node scripts/daily-digest.mjs --send     stampa e invia via Resend
//   node scripts/daily-digest.mjs --json     JSON grezzo (debug)
//
// Variabili lette da .env (o dall'ambiente, che ha la precedenza):
//   RESEND_API_KEY            obbligatoria con --send
//   DIGEST_TO                 destinatario (default: RESEND_FROM_EMAIL)
//   DIGEST_FROM               mittente (default: Localis <luigi@localis.guide>)
//   GA4_SERVICE_ACCOUNT_FILE  service account per GA4, se non e' in private/

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

function loadDotenv() {
  let raw;
  try { raw = readFileSync(join(ROOT, '.env'), 'utf8'); } catch { return; }
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, value] = m;
    // L'ambiente reale vince sul file: cosi' lo scheduler puo' sovrascrivere.
    if (process.env[key] === undefined) {
      process.env[key] = value.replace(/^["']|["']$/g, '');
    }
  }
}

function collect() {
  // stderr ignorato: digest-data.mjs lo usa per errori non fatali (es. repo git
  // assenti), e i dati veri arrivano su stdout.
  const out = execFileSync(process.execPath, [join(ROOT, 'private', 'digest-data.mjs')], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 20 * 1024 * 1024,
  });
  return JSON.parse(out);
}

// I dati GA4 gia' raccolti contengono i vecchi path /access/<JWT> con dentro
// email e session Stripe del cliente. La redazione lato sito vale solo da ora
// in avanti: qui li togliamo anche dal digest, che finisce in una email.
const redactToken = (p) =>
  String(p || '').replace(/^(\/(?:en|de))?\/access\/[^/?#\s]+/, '$1/access/[token]');

const pct = (now, before) => {
  if (!before) return now ? '  (nuovo)' : '';
  const d = Math.round(((now - before) / before) * 100);
  return `  (${d >= 0 ? '+' : ''}${d}% vs 7gg prima)`;
};

function render(d) {
  const L = [];
  const ga4 = d.ga4 || {};
  const s7 = ga4.site7d || {};
  const p7 = ga4.prev7d || {};
  const f = ga4.funnel7d || {};

  L.push(`LOCALIS — digest del ${d.date}`);
  L.push('='.repeat(52));
  L.push('');

  L.push('IERI');
  L.push(`  ${ga4.sessions ?? 0} sessioni · ${ga4.users ?? 0} utenti · ${ga4.pageviews ?? 0} pagine viste`);
  const evs = Object.entries(ga4.events || {}).sort((a, b) => b[1] - a[1]);
  L.push(evs.length ? `  eventi: ${evs.map(([k, v]) => `${k} ${v}`).join(' · ')}` : '  eventi: nessuno');
  L.push('');

  L.push('ULTIMI 7 GIORNI');
  L.push(`  ${s7.sessions ?? 0} sessioni${pct(s7.sessions ?? 0, p7.sessions ?? 0)}`);
  L.push(`  ${s7.users ?? 0} utenti${pct(s7.users ?? 0, p7.users ?? 0)}`);
  L.push(`  funnel: ${f.scan ?? 0} scan → ${f.preview ?? 0} preview → ${f.checkout ?? 0} checkout → ${f.purchase ?? 0} acquisti`);
  for (const c of s7.channels || []) L.push(`    ${String(c.channel).padEnd(18)} ${c.sessions}`);
  L.push('');

  if ((s7.topPages || []).length) {
    L.push('PAGINE PIU\u2019 VISTE (7gg)');
    for (const p of s7.topPages) L.push(`  ${String(p.views).padStart(3)}  ${redactToken(p.path)}`);
    L.push('');
  }

  const scans = ga4.scanCompare || [];
  if (scans.length) {
    L.push('SCANSIONI QR PER PARTNER (server vs GA4)');
    for (const r of scans) L.push(`  ${String(r.partner).padEnd(26)} server ${String(r.server).padStart(3)}   GA4 ${String(r.ga4).padStart(3)}`);
    if (d.server && d.server.reachable === false) {
      L.push('  ATTENZIONE: contatore server non raggiungibile, la colonna "server" non e\u2019 attendibile.');
    }
    L.push('');
  }

  const rc = d.recontact || [];
  if (rc.length) {
    L.push(`PARTNER DA RICONTATTARE (${rc.length})`);
    for (const p of [...rc].sort((a, b) => b.age - a.age)) {
      L.push(`  ${String(p.age).padStart(3)} giorni  ${p.name} (${p.slug}) — dal ${p.since}`);
    }
    L.push('');
  }

  const commits = (d.commits && d.commits.localis) || [];
  L.push(commits.length ? `COMMIT DI IERI (${commits.length})` : 'COMMIT DI IERI: nessuno');
  for (const c of commits) L.push(`  · ${c}`);

  return L.join('\n');
}

async function send(subject, text) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY mancante: impossibile inviare.');
  const to = process.env.DIGEST_TO || process.env.RESEND_FROM_EMAIL;
  if (!to) throw new Error('DIGEST_TO mancante: nessun destinatario.');
  const from = process.env.DIGEST_FROM || 'Localis <luigi@localis.guide>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!res.ok) throw new Error(`Resend ha risposto ${res.status}: ${await res.text()}`);
  const { id } = await res.json();
  return { id, to };
}

loadDotenv();
const argv = process.argv.slice(2);
const data = collect();

if (argv.includes('--json')) {
  console.log(JSON.stringify(data, null, 2));
} else {
  const text = render(data);
  console.log(text);
  if (argv.includes('--send')) {
    const { id, to } = await send(`Localis — digest del ${data.date}`, text);
    console.log(`\n[inviato a ${to} — id ${id}]`);
  }
}
