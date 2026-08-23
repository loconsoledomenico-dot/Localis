// Registra in GA4 le dimensioni personalizzate mancanti.
//
// Perche' serve: un parametro inviato con un evento NON e' interrogabile finche'
// non esiste una dimensione personalizzata che lo dichiara. Oggi lang,
// traffic_type e cta_source viaggiano ma non si possono leggere in nessun report.
// La registrazione NON e' retroattiva: vale dal momento in cui viene creata.
//
//   node scripts/ga4-register-dimensions.mjs            elenca e mostra cosa manca
//   node scripts/ga4-register-dimensions.mjs --create   crea le mancanti
//
// Richiede l'Admin API attiva sul progetto Google e il service account con
// ruolo Editor sulla property (Viewer non basta per creare).

import { readFileSync } from 'node:fs';
import { google } from 'googleapis';

const PROPERTY = process.env.GA4_PROPERTY_ID || '538539129';

// parameterName = il nome esatto del parametro inviato dagli eventi.
const WANTED = [
  {
    parameterName: 'lang',
    displayName: 'Lingua',
    description: 'Lingua della pagina/acquisto: it, en, de. Inviata da client e server.',
  },
  {
    parameterName: 'traffic_type',
    displayName: 'Tipo traffico',
    description: 'internal per le prove del fondatore. Serve a escluderle dai report.',
  },
  {
    parameterName: 'cta_source',
    displayName: 'Origine evento',
    description: 'server_webhook per gli eventi inviati via Measurement Protocol.',
  },
  {
    parameterName: 'reason',
    displayName: 'Motivo errore',
    description: 'Messaggio di errore su checkout_error. Serve a capire perche un pagamento non parte.',
  },
  {
    parameterName: 'qr_url',
    displayName: 'QR URL',
    description: 'URL completo di atterraggio della scansione QR. Aggiunto da attachAttribution.',
  },
];

async function client() {
  const file = process.env.GA4_SERVICE_ACCOUNT_FILE;
  if (!file) throw new Error('GA4_SERVICE_ACCOUNT_FILE non impostata.');
  const credentials = JSON.parse(readFileSync(file, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.edit'],
  });
  return google.analyticsadmin({ version: 'v1beta', auth });
}

function explain(err) {
  const msg = err?.message || String(err);
  if (/SERVICE_DISABLED|has not been used in project/.test(msg)) {
    return 'Admin API disabilitata. Attivala qui, poi aspetta un minuto:\n' +
      '  https://console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview?project=898456015955';
  }
  if (/PERMISSION_DENIED|insufficient/i.test(msg)) {
    return 'Il service account non ha i permessi per scrivere.\n' +
      '  GA4 > Admin > Gestione accesso alla property: serve il ruolo Editor, non Viewer.';
  }
  return msg;
}

const admin = await client();
const create = process.argv.includes('--create');

let existing;
try {
  const res = await admin.properties.customDimensions.list({
    parent: `properties/${PROPERTY}`,
    pageSize: 200,
  });
  existing = res.data.customDimensions || [];
} catch (err) {
  console.error('Impossibile leggere le dimensioni:\n' + explain(err));
  process.exit(1);
}

const have = new Set(existing.map((d) => d.parameterName));
console.log(`Property ${PROPERTY} — ${existing.length} dimensioni registrate:`);
for (const d of existing.sort((a, b) => a.parameterName.localeCompare(b.parameterName))) {
  console.log(`  ${d.parameterName.padEnd(18)} ${d.scope.padEnd(6)} ${d.displayName}`);
}

const missing = WANTED.filter((w) => !have.has(w.parameterName));
console.log(`\nDa registrare: ${missing.length ? missing.map((m) => m.parameterName).join(', ') : 'nessuna'}`);

if (!missing.length) process.exit(0);

if (!create) {
  console.log('\nRilancia con --create per crearle.');
  process.exit(0);
}

for (const w of missing) {
  try {
    await admin.properties.customDimensions.create({
      parent: `properties/${PROPERTY}`,
      requestBody: { ...w, scope: 'EVENT' },
    });
    console.log(`  creata: ${w.parameterName}`);
  } catch (err) {
    console.error(`  FALLITA ${w.parameterName}: ${explain(err)}`);
    process.exitCode = 1;
  }
}
