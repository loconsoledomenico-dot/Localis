import { google } from 'googleapis';
import { getGoogleAuth } from '../scripts/google-auth.mjs';

const propertyId = process.env.GA4_PROPERTY_ID || '538539129';

// Auth via service account (non scade) con fallback al token OAuth utente.
// Stessa sorgente del sync del foglio partner: il vecchio OAuth dedicato qui
// scadeva (invalid_grant) e mandava in errore digest + script GA4 manuali.
export async function getAuth() {
  const { auth } = await getGoogleAuth({
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  return auth;
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
