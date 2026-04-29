export interface AccessEmailData {
  accessUrl: string;
  guideTitles: string[];
}

export function renderAccessEmailIt(data: AccessEmailData): { subject: string; html: string; text: string } {
  const guidesList = data.guideTitles.map((t) => `🎧  ${t}`).join('\n');
  const guidesListHtml = data.guideTitles
    .map((t) => `<li style="margin: 0.5em 0; font-family: 'Spectral', Georgia, serif; font-size: 18px; color: #1C1510;">🎧 ${escapeHtml(t)}</li>`)
    .join('');

  const subject = data.guideTitles.length === 1
    ? `La tua audioguida è pronta · Localis`
    : `Le tue audioguide sono pronte · Localis`;

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 32px 20px; background: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1510;">
  <div style="max-width: 540px; margin: 0 auto;">
    <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 400; margin: 0 0 24px 0; color: #1C1510;">
      Loc<em style="color: #C2521A; font-style: italic;">alis</em>
    </h1>

    <p style="font-size: 16px; line-height: 1.6; color: #1C1510; margin: 0 0 16px 0;">Ciao,</p>
    <p style="font-size: 16px; line-height: 1.6; color: #1C1510; margin: 0 0 24px 0;">
      Grazie per aver scelto Localis. La tua audioguida ti aspetta.
    </p>

    <ul style="list-style: none; padding: 0; margin: 0 0 32px 0;">
      ${guidesListHtml}
    </ul>

    <p style="margin: 0 0 32px 0;">
      <a href="${data.accessUrl}" style="display: inline-block; padding: 14px 28px; background: #1C1510; color: #FAF7F2; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Apri la guida →
      </a>
    </p>

    <hr style="border: 0; border-top: 1px solid #D6CDBE; margin: 32px 0;">

    <h2 style="font-family: Georgia, serif; font-size: 18px; font-weight: 400; color: #1C1510; margin: 0 0 12px 0;">Come funziona</h2>
    <ol style="font-size: 14px; line-height: 1.7; color: #5A6477; padding-left: 20px; margin: 0 0 24px 0;">
      <li>Apri il link sopra dal tuo telefono</li>
      <li>Clicca play. Cammina. Ascolta.</li>
      <li>Il link è tuo per sempre — riascoltala quando vuoi</li>
      <li>Funziona anche offline dopo il primo play</li>
    </ol>

    <p style="font-size: 14px; line-height: 1.6; color: #5A6477; margin: 0 0 16px 0;">
      Salvalo nei preferiti del browser. Se cambi telefono, riapri lo stesso link.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #5A6477; margin: 0 0 24px 0;">
      Domande? Rispondi a questa email — leggiamo tutto.
    </p>

    <p style="font-size: 14px; line-height: 1.6; color: #1C1510; margin: 0;">
      Domenico &amp; Luigi · Localis
    </p>
  </div>
</body>
</html>`;

  const text = `Ciao,

Grazie per aver scelto Localis. La tua audioguida ti aspetta.

${guidesList}

Apri la guida: ${data.accessUrl}

──────────────────────────

Come funziona:
1. Apri il link sopra dal tuo telefono
2. Clicca play. Cammina. Ascolta.
3. Il link è tuo per sempre — riascoltala quando vuoi
4. Funziona anche offline dopo il primo play

Salvalo nei preferiti del browser.
Se cambi telefono, riapri lo stesso link.

Domande? Rispondi a questa email — leggiamo tutto.

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
