import fs from 'node:fs/promises';
import { google } from 'googleapis';

const propertyId = process.env.GA4_PROPERTY_ID || '538539129';
const credentialsPath = new URL('./ga4-oauth-client.json', import.meta.url);
const tokenPath = new URL('./ga4-oauth-token.json', import.meta.url);

export async function getAuth() {
  const raw = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
  const client = raw.installed || raw.web;
  const redirectUri = client.redirect_uris?.find((uri) => uri.includes('localhost')) || client.redirect_uris?.[0];
  const oauth2Client = new google.auth.OAuth2(client.client_id, client.client_secret, redirectUri);
  oauth2Client.setCredentials(JSON.parse(await fs.readFile(tokenPath, 'utf8')));
  return oauth2Client;
}

export async function runReport(requestBody) {
  const auth = await getAuth();
  const analyticsData = google.analyticsdata({ version: 'v1beta', auth });
  const response = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody,
  });
  return response.data;
}
