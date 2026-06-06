import fs from 'node:fs/promises';
import http from 'node:http';
import { google } from 'googleapis';

const credentialsPath = new URL('../private/ga4-oauth-client.json', import.meta.url);
const tokenPath = new URL('../private/gsc-oauth-token.json', import.meta.url);
const scopes = ['https://www.googleapis.com/auth/webmasters'];
const port = Number(process.env.GOOGLE_OAUTH_PORT || 3005);
const redirectUri = `http://localhost:${port}/oauth2callback`;

async function loadOAuthClient() {
  const raw = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
  const client = raw.installed || raw.web;
  return new google.auth.OAuth2(client.client_id, client.client_secret, redirectUri);
}

function authorizeWithLocalServer(authUrl) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || '/', redirectUri);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        if (error) throw new Error(error);
        if (!code) {
          res.writeHead(404);
          res.end('Missing code');
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Google Search Console collegata</h1><p>Puoi chiudere questa scheda e tornare a Codex.</p>');
        server.close();
        resolve(code);
      } catch (err) {
        server.close();
        reject(err);
      }
    });

    server.listen(port, 'localhost', async () => {
      const linkPath = new URL('../private/gsc-auth-link.html', import.meta.url);
      await fs.writeFile(
        linkPath,
        `<!doctype html><meta charset="utf-8"><title>GSC OAuth</title><a href="${authUrl}">Autorizza Google Search Console</a>`,
      );
      console.log('Opening Google Search Console authorization in your browser...');
      console.log(`Redirect URI: ${redirectUri}`);
      console.log(`Authorization URL: ${authUrl}`);
      console.log(`Auth link file: ${linkPath.pathname}`);
    });
    server.on('error', reject);
  });
}

const oauth2Client = await loadOAuthClient();
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: scopes,
});

const code = await authorizeWithLocalServer(authUrl);
const { tokens } = await oauth2Client.getToken(String(code).trim());
await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2));

console.log(`Saved token: ${tokenPath.pathname}`);
