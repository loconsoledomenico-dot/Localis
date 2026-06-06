import fs from 'node:fs/promises';
import { google } from 'googleapis';

const credentialsPath = new URL('../private/ga4-oauth-client.json', import.meta.url);
const tokenPath = new URL('../private/gsc-oauth-token.json', import.meta.url);
const defaultSiteUrl = process.env.GSC_SITE_URL || 'sc-domain:localis.guide';
const defaultSitemapUrl = process.env.GSC_SITEMAP_URL || 'https://localis.guide/sitemap-index.xml';
const defaultInspectUrl = process.env.GSC_INSPECT_URL || 'https://localis.guide/';

async function getAuth() {
  const raw = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
  const client = raw.installed || raw.web;
  const redirectUri = client.redirect_uris?.find((uri) => uri.includes('127.0.0.1') || uri.includes('localhost'))
    || 'http://127.0.0.1:3000/oauth2callback';
  const oauth2Client = new google.auth.OAuth2(client.client_id, client.client_secret, redirectUri);
  oauth2Client.setCredentials(JSON.parse(await fs.readFile(tokenPath, 'utf8')));
  return oauth2Client;
}

function usage() {
  console.log(`Usage:
  pnpm gsc:auth
  pnpm gsc:sites
  pnpm gsc:sitemaps [siteUrl]
  pnpm gsc:submit-sitemap [siteUrl] [sitemapUrl]
  pnpm gsc:inspect [url] [siteUrl]
  pnpm gsc:performance [days] [siteUrl]

Defaults:
  siteUrl    ${defaultSiteUrl}
  sitemapUrl ${defaultSitemapUrl}
`);
}

function rowsToTable(rows = []) {
  return rows.map((row) => ({
    keys: row.keys?.join(' | ') ?? '',
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));
}

async function main() {
  const [command = 'help', ...args] = process.argv.slice(2);
  if (command === 'help' || command === '--help' || command === '-h') {
    usage();
    return;
  }

  const auth = await getAuth();
  const gsc = google.searchconsole({ version: 'v1', auth });

  if (command === 'sites') {
    const response = await gsc.sites.list();
    console.table(response.data.siteEntry ?? []);
    return;
  }

  if (command === 'sitemaps') {
    const siteUrl = args[0] || defaultSiteUrl;
    const response = await gsc.sitemaps.list({ siteUrl });
    console.table((response.data.sitemap ?? []).map((sitemap) => ({
      path: sitemap.path,
      lastSubmitted: sitemap.lastSubmitted,
      isPending: sitemap.isPending,
      isSitemapsIndex: sitemap.isSitemapsIndex,
      errors: sitemap.errors,
      warnings: sitemap.warnings,
      contents: JSON.stringify(sitemap.contents ?? []),
    })));
    return;
  }

  if (command === 'submit-sitemap') {
    const siteUrl = args[0] || defaultSiteUrl;
    const feedpath = args[1] || defaultSitemapUrl;
    await gsc.sitemaps.submit({ siteUrl, feedpath });
    console.log(`Submitted sitemap ${feedpath} for ${siteUrl}`);
    return;
  }

  if (command === 'inspect') {
    const inspectionUrl = args[0] || defaultInspectUrl;
    const siteUrl = args[1] || defaultSiteUrl;
    const response = await gsc.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl,
        siteUrl,
      },
    });
    console.log(JSON.stringify(response.data.inspectionResult ?? response.data, null, 2));
    return;
  }

  if (command === 'performance') {
    const days = Number(args[0] || 28);
    const siteUrl = args[1] || defaultSiteUrl;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - Math.max(1, days - 1));

    const fmt = (date) => date.toISOString().split('T')[0];
    const response = await gsc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        dimensions: ['page'],
        rowLimit: 25,
      },
    });
    console.table(rowsToTable(response.data.rows));
    return;
  }

  usage();
  process.exitCode = 1;
}

main().catch((error) => {
  if (error.code === 'ENOENT' && String(error.path || '').includes('gsc-oauth-token.json')) {
    console.error('Missing GSC token. Run: pnpm gsc:auth');
    process.exit(1);
  }
  console.error(error.response?.data || error.message || error);
  process.exit(1);
});
