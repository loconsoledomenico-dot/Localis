import fs from 'node:fs/promises';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { google } from 'googleapis';

const credentialsPath = new URL('../private/ga4-oauth-client.json', import.meta.url);
const tokenPath = new URL('../private/google-oauth-token.json', import.meta.url);
const scopes = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
];

async function loadOAuthClient() {
  const raw = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
  const client = raw.installed || raw.web;
  const redirectUri = 'http://127.0.0.1:3000/oauth2callback';
  return new google.auth.OAuth2(client.client_id, client.client_secret, redirectUri);
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
        res.end('<h1>Google collegato</h1><p>Puoi chiudere questa scheda e tornare a Codex.</p>');
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

const oauth2Client = await loadOAuthClient();
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: scopes,
});

const code = await authorizeWithLocalServer(authUrl);
const { tokens } = await oauth2Client.getToken(code.trim());
await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2));

console.log(`Saved token: ${tokenPath.pathname}`);
