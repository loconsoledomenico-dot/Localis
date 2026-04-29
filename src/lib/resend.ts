import { Resend } from 'resend';

let _client: Resend | null = null;

function getResend(): Resend {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('RESEND_API_KEY is not set');
  }
  _client = new Resend(key);
  return _client;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const fromAddress = params.from || process.env.RESEND_FROM_EMAIL || 'Localis <noreply@localis.guide>';

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: fromAddress,
    to: [params.to],
    subject: params.subject,
    html: params.html,
    text: params.text,
    replyTo: params.replyTo || 'hello@localis.guide',
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`);
  }
}
