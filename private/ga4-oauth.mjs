import fs from 'node:fs/promises';
import http from 'node:http';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { execFile } from 'node:child_process';
import { google } from 'googleapis';

const propertyId = process.env.GA4_PROPERTY_ID || '538539129';
const credentialsPath = new URL('./ga4-oauth-client.json', import.meta.url);
const tokenPath = new URL('./ga4-oauth-token.json', import.meta.url);
const scopes = ['https://www.googleapis.com/auth/analytics.readonly'];

async function loadOAuthClient() {
  const raw = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
  const client = raw.installed || raw.web;
  if (!client) throw new Error('OAuth client JSON must contain installed or web credentials');

  const useLocalServer = process.env.GA4_LOCAL_SERVER === '1';
  const redirectUri = useLocalServer
    ? 'http://127.0.0.1:3000/oauth2callback'
    : client.redirect_uris?.find((uri) => uri.includes('localhost')) || client.redirect_uris?.[0];
  const oauth2Client = new google.auth.OAuth2(client.client_id, client.client_secret, redirectUri);

  try {
    const token = JSON.parse(await fs.readFile(tokenPath, 'utf8'));
    oauth2Client.setCredentials(token);
    return oauth2Client;
  } catch {
    const codeFromEnv = process.env.GA4_AUTH_CODE || '';
    let code = codeFromEnv.trim();
    if (!code && useLocalServer) {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes,
      });
      code = await authorizeWithLocalServer(authUrl);
    } else if (!code) {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes,
      });
      console.log('\nOpen this URL in your browser, authorize access, then paste the code here:\n');
      console.log(authUrl);
      const rl = readline.createInterface({ input, output });
      code = await rl.question('\nAuthorization code: ');
      rl.close();
    }
    const { tokens } = await oauth2Client.getToken(code.trim());
    oauth2Client.setCredentials(tokens);
    await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2));
    return oauth2Client;
  }
}

function openBrowser(url) {
  return new Promise((resolve) => {
    execFile('powershell', ['-NoProfile', '-Command', `Start-Process '${url.replace(/'/g, "''")}'`], () => resolve());
  });
}

function authorizeWithLocalServer(authUrl) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || '/', 'http://127.0.0.1:3000');
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        if (error) throw new Error(error);
        if (!code) {
          res.writeHead(404);
          res.end('Missing code');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>GA4 collegato</h1><p>Puoi chiudere questa scheda e tornare a Codex.</p>');
        server.close();
        resolve(code);
      } catch (err) {
        server.close();
        reject(err);
      }
    });

    server.listen(3000, '127.0.0.1', async () => {
      console.log('Opening Google authorization in your browser...');
      await openBrowser(authUrl);
    });

    server.on('error', reject);
  });
}

async function main() {
  const auth = await loadOAuthClient();
  const analyticsData = google.analyticsdata({ version: 'v1beta', auth });
  const response = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'eventCount' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    },
  });

  const rows = response.data.rows || [];
  console.log(JSON.stringify({
    propertyId,
    rowCount: rows.length,
    rows: rows.map((row) => ({
      date: row.dimensionValues?.[0]?.value,
      activeUsers: Number(row.metricValues?.[0]?.value || 0),
      sessions: Number(row.metricValues?.[1]?.value || 0),
      pageViews: Number(row.metricValues?.[2]?.value || 0),
      eventCount: Number(row.metricValues?.[3]?.value || 0),
    })),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
