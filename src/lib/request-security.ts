/**
 * Accept same-origin browser POSTs and server-to-server calls without Origin.
 * Reject explicit cross-site origins before doing paid or email-sending work.
 */
export function hasAllowedOrigin(request: Request, currentOrigin: string): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  const allowed = new Set([
    currentOrigin.replace(/\/$/, ''),
    (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, ''),
  ].filter(Boolean));

  return allowed.has(origin.replace(/\/$/, ''));
}
