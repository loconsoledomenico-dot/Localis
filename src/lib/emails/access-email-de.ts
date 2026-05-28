export interface AccessEmailData {
  accessUrl: string;
  guideTitles: string[];
}

export function renderAccessEmailDe(data: AccessEmailData): { subject: string; html: string; text: string } {
  const guidesList = data.guideTitles.map((t) => `[Audio] ${t}`).join('\n');
  const guidesListHtml = data.guideTitles
    .map((t) => `<li style="margin: 0.5em 0; font-family: 'Spectral', Georgia, serif; font-size: 18px; color: #1C1510;">[Audio] ${escapeHtml(t)}</li>`)
    .join('');

  const subject = data.guideTitles.length === 1
    ? 'Dein Audioguide ist bereit - Localis'
    : 'Deine Audioguides sind bereit - Localis';

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 32px 20px; background: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1510;">
  <div style="max-width: 540px; margin: 0 auto;">
    <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 400; margin: 0 0 24px 0; color: #1C1510;">
      Loc<em style="color: #C2521A; font-style: italic;">alis</em>
    </h1>

    <p style="font-size: 16px; line-height: 1.6; color: #1C1510; margin: 0 0 16px 0;">Hallo,</p>
    <p style="font-size: 16px; line-height: 1.6; color: #1C1510; margin: 0 0 24px 0;">
      Danke, dass du Localis gewaehlt hast. Dein Audioguide ist bereit.
    </p>

    <ul style="list-style: none; padding: 0; margin: 0 0 32px 0;">
      ${guidesListHtml}
    </ul>

    <p style="margin: 0 0 32px 0;">
      <a href="${data.accessUrl}" style="display: inline-block; padding: 14px 28px; background: #1C1510; color: #FAF7F2; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Guide oeffnen
      </a>
    </p>

    <hr style="border: 0; border-top: 1px solid #D6CDBE; margin: 32px 0;">

    <h2 style="font-family: Georgia, serif; font-size: 18px; font-weight: 400; color: #1C1510; margin: 0 0 12px 0;">So funktioniert es</h2>
    <ol style="font-size: 14px; line-height: 1.7; color: #5A6477; padding-left: 20px; margin: 0 0 24px 0;">
      <li>Oeffne den Link oben auf deinem Smartphone</li>
      <li>Tippe auf Play. Geh los. Hoer zu.</li>
      <li>Der Link gehoert dir dauerhaft und kann jederzeit erneut genutzt werden</li>
      <li>Nach dem ersten Abspielen funktioniert der Guide offline</li>
    </ol>

    <p style="font-size: 14px; line-height: 1.6; color: #5A6477; margin: 0 0 16px 0;">
      Speichere den Link in deinen Browser-Lesezeichen. Wenn du das Smartphone wechselst, oeffne denselben Link erneut.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #5A6477; margin: 0 0 24px 0;">
      Fragen? Antworte einfach auf diese E-Mail.
    </p>

    <p style="font-size: 14px; line-height: 1.6; color: #1C1510; margin: 0;">
      Domenico &amp; Luigi - Localis
    </p>
  </div>
</body>
</html>`;

  const text = `Hallo,

Danke, dass du Localis gewaehlt hast. Dein Audioguide ist bereit.

${guidesList}

Guide oeffnen: ${data.accessUrl}

--------------------------

So funktioniert es:
1. Oeffne den Link oben auf deinem Smartphone
2. Tippe auf Play. Geh los. Hoer zu.
3. Der Link gehoert dir dauerhaft und kann jederzeit erneut genutzt werden
4. Nach dem ersten Abspielen funktioniert der Guide offline

Speichere den Link in deinen Browser-Lesezeichen.
Wenn du das Smartphone wechselst, oeffne denselben Link erneut.

Fragen? Antworte einfach auf diese E-Mail.

Domenico & Luigi - Localis
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
