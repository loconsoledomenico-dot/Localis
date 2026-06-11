import fs from 'node:fs/promises';
import { google } from 'googleapis';

const oauthClientPath = new URL('../private/ga4-oauth-client.json', import.meta.url);
const oauthTokenPath = new URL('../private/google-oauth-token.json', import.meta.url);

const serviceAccountCandidatePaths = [
  process.env.PARTNER_QR_SERVICE_ACCOUNT_FILE,
  process.env.GOOGLE_SERVICE_ACCOUNT_FILE,
  process.env.GA4_SERVICE_ACCOUNT_FILE,
  new URL('../private/localis-outreach-01a30f358fe7.json', import.meta.url),
  new URL('../private/localis-outreach-6b49a89186ac.json', import.meta.url),
].filter(Boolean);

export const analyticsAndSheetsScopes = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
];

async function pathExists(pathLike) {
  try {
    await fs.access(pathLike);
    return true;
  } catch {
    return false;
  }
}

function stringifyPath(pathLike) {
  return pathLike instanceof URL ? pathLike.pathname : String(pathLike);
}

async function loadFirstServiceAccount() {
  for (const candidate of serviceAccountCandidatePaths) {
    if (!await pathExists(candidate)) continue;
    const credentials = JSON.parse(await fs.readFile(candidate, 'utf8'));
    if (credentials.type !== 'service_account') continue;
    return {
      credentials,
      credentialsPath: stringifyPath(candidate),
      serviceAccountEmail: credentials.client_email || '',
    };
  }
  return null;
}

async function loadOAuthClient() {
  const raw = JSON.parse(await fs.readFile(oauthClientPath, 'utf8'));
  const client = raw.installed || raw.web;
  const redirectUri = 'http://127.0.0.1:3000/oauth2callback';
  const oauth2Client = new google.auth.OAuth2(client.client_id, client.client_secret, redirectUri);
  const token = JSON.parse(await fs.readFile(oauthTokenPath, 'utf8'));
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

export async function getGoogleAuth({ scopes = analyticsAndSheetsScopes, preferServiceAccount = true } = {}) {
  if (preferServiceAccount) {
    const serviceAccount = await loadFirstServiceAccount();
    if (serviceAccount) {
      return {
        auth: new google.auth.GoogleAuth({
          credentials: serviceAccount.credentials,
          scopes,
        }),
        authMode: 'service_account',
        authPath: serviceAccount.credentialsPath,
        serviceAccountEmail: serviceAccount.serviceAccountEmail,
      };
    }
  }

  return {
    auth: await loadOAuthClient(),
    authMode: 'oauth_user',
    authPath: stringifyPath(oauthTokenPath),
    serviceAccountEmail: '',
  };
}

export function buildGoogleAccessHelp({ propertyId, spreadsheetId, serviceAccountEmail }) {
  const lines = [];
  if (serviceAccountEmail) {
    lines.push(`Grant GA4 Viewer/Analyst access on property ${propertyId} to ${serviceAccountEmail}.`);
    if (spreadsheetId) {
      lines.push(`Share spreadsheet ${spreadsheetId} with Editor access to ${serviceAccountEmail}.`);
    }
  }
  lines.push('Fallback only: refresh the user OAuth token with `node scripts/google-oauth.mjs`.');
  return lines.join(' ');
}
