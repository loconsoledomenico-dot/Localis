export interface AccessEmailData {
  accessUrl: string;
  guideTitles: string[];
}

export function renderAccessEmailEn(data: AccessEmailData): { subject: string; html: string; text: string } {
  const guidesList = data.guideTitles.map((t) => `🎧  ${t}`).join('\n');
  const guidesListHtml = data.guideTitles
    .map((t) => `<li style="margin: 0.5em 0; font-family: 'Spectral', Georgia, serif; font-size: 18px; color: #1C1510;">🎧 ${escapeHtml(t)}</li>`)
    .join('');

  const subject = data.guideTitles.length === 1
    ? `Your audio guide is ready · Localis`
    : `Your audio guides are ready · Localis`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 32px 20px; background: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1510;">
  <div style="max-width: 540px; margin: 0 auto;">
    <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 400; margin: 0 0 24px 0; color: #1C1510;">
      Loc<em style="color: #C2521A; font-style: italic;">alis</em>
    </h1>

    <p style="font-size: 16px; line-height: 1.6; color: #1C1510; margin: 0 0 16px 0;">Hi,</p>
    <p style="font-size: 16px; line-height: 1.6; color: #1C1510; margin: 0 0 24px 0;">
      Thanks for choosing Localis. Your audio guide is ready.
    </p>

    <ul style="list-style: none; padding: 0; margin: 0 0 32px 0;">
      ${guidesListHtml}
    </ul>

    <p style="margin: 0 0 32px 0;">
      <a href="${data.accessUrl}" style="display: inline-block; padding: 14px 28px; background: #1C1510; color: #FAF7F2; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Open the guide →
      </a>
    </p>

    <hr style="border: 0; border-top: 1px solid #D6CDBE; margin: 32px 0;">

    <h2 style="font-family: Georgia, serif; font-size: 18px; font-weight: 400; color: #1C1510; margin: 0 0 12px 0;">How it works</h2>
    <ol style="font-size: 14px; line-height: 1.7; color: #5A6477; padding-left: 20px; margin: 0 0 24px 0;">
      <li>Open the link above on your phone</li>
      <li>Tap play. Walk. Listen.</li>
      <li>The link is yours forever — replay anytime</li>
      <li>Works offline after the first play</li>
    </ol>

    <p style="font-size: 14px; line-height: 1.6; color: #5A6477; margin: 0 0 16px 0;">
      Save it in your browser bookmarks. If you change phones, reopen the same link.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #5A6477; margin: 0 0 24px 0;">
      Questions? Reply to this email — we read everything.
    </p>

    <p style="font-size: 14px; line-height: 1.6; color: #1C1510; margin: 0;">
      Domenico &amp; Luigi · Localis
    </p>
  </div>
</body>
</html>`;

  const text = `Hi,

Thanks for choosing Localis. Your audio guide is ready.

${guidesList}

Open the guide: ${data.accessUrl}

──────────────────────────

How it works:
1. Open the link above on your phone
2. Tap play. Walk. Listen.
3. The link is yours forever — replay anytime
4. Works offline after the first play

Save it in your browser bookmarks.
If you change phones, reopen the same link.

Questions? Reply to this email — we read everything.

Domenico & Luigi · Localis
hello@localis.guide
https://localis.guide
`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
