import fs from 'node:fs/promises';
import { google } from 'googleapis';
import { getGoogleAuth, buildGoogleAccessHelp } from './google-auth.mjs';

/**
 * Crea (una volta) un Google Sheet di tracciamento locandine QR, pre-compilato
 * con i codici del registro. Tu riempi a mano: partner, indirizzo, n. locandine.
 *
 * Forza l'auth utente (preferServiceAccount: false) così il foglio nasce nel TUO
 * Drive e lo vedi subito. Salva l'id in private/qr-tracking-sheet-state.json per
 * non ricrearlo ad ogni run.
 *
 * Uso: node scripts/qr-tracking-sheet.mjs
 */

const registryPath = new URL('../src/data/qr-codes.json', import.meta.url);
const statePath = new URL('../private/qr-tracking-sheet-state.json', import.meta.url);
const sheetTitle = 'Locandine';
const spreadsheetTitle = 'Localis — Tracciamento locandine QR';

const HEADERS = [
  'Codice',
  'Partner',
  'Indirizzo',
  'N° locandine consegnate',
  'Data consegna',
  'Assegnato sul sito?',
  'Note',
];

async function loadCodes() {
  const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
  // Esclude il codice seed di esempio; ordina per lotto poi per codice.
  return registry
    .filter((c) => c.batch && c.batch !== 'esempio')
    .sort((a, b) => (a.batch || '').localeCompare(b.batch || '') || a.code.localeCompare(b.code))
    .map((c) => c.code);
}

async function readState() {
  try {
    return JSON.parse(await fs.readFile(statePath, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const codes = await loadCodes();
  const auth = (await getGoogleAuth({ preferServiceAccount: false })).auth;
  const sheets = google.sheets({ version: 'v4', auth });

  const existing = await readState();
  let spreadsheetId = process.env.QR_TRACKING_SPREADSHEET_ID || existing?.spreadsheetId || '';

  if (!spreadsheetId) {
    const created = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: spreadsheetTitle },
        sheets: [{ properties: { title: sheetTitle } }],
      },
    });
    spreadsheetId = created.data.spreadsheetId;
  }

  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
  const firstSheet = sheetMeta.data.sheets[0];
  const sheetId = firstSheet.properties.sheetId;
  const sheetName = firstSheet.properties.title;

  // Righe: header + una per codice (codice in colonna A, resto vuoto da riempire).
  const values = [HEADERS, ...codes.map((code) => [code, '', '', '', '', '', ''])];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // Header in grassetto su sfondo chiaro
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                backgroundColor: { red: 0.9, green: 0.93, blue: 0.96 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        },
        // Congela la riga di intestazione e la colonna Codice
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1, frozenColumnCount: 1 } },
            fields: 'gridProperties(frozenRowCount,frozenColumnCount)',
          },
        },
        // Menu a tendina sì/no per "Assegnato sul sito?" (colonna F = index 5)
        {
          setDataValidation: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: 5, endColumnIndex: 6 },
            rule: {
              condition: {
                type: 'ONE_OF_LIST',
                values: [{ userEnteredValue: 'sì' }, { userEnteredValue: 'no' }],
              },
              showCustomUi: true,
              strict: false,
            },
          },
        },
        // Auto-larghezza colonne
        {
          autoResizeDimensions: {
            dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: HEADERS.length },
          },
        },
      ],
    },
  });

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  await fs.writeFile(
    statePath,
    `${JSON.stringify({ spreadsheetId, spreadsheetUrl: url, codes: codes.length, updatedAt: today() }, null, 2)}\n`,
  );

  console.log(`Foglio pronto con ${codes.length} codici pre-compilati.`);
  console.log(url);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

main().catch(async (error) => {
  const help = buildGoogleAccessHelp({ propertyId: '', spreadsheetId: '', serviceAccountEmail: '' });
  if (error.code === 'ENOENT' && String(error.path || '').includes('google-oauth-token.json')) {
    console.error(`Token OAuth Google mancante. ${help}`);
  } else if (error.response?.data?.error === 'invalid_grant' || error.error === 'invalid_grant') {
    console.error(`Token OAuth Google scaduto/revocato. ${help}`);
  } else {
    console.error(error.response?.data || error.message || error);
  }
  process.exit(1);
});
