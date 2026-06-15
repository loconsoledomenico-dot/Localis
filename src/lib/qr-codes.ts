import registryData from '../data/qr-codes.json';

export interface QrCode {
  code: string;
  partner_slug: string | null;
  batch?: string;
  printed_at?: string;
  assigned_at?: string;
  note?: string;
}

export type CodeStatus = 'assigned' | 'unassigned' | 'unknown';

const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

export function isValidCode(code: string): boolean {
  return typeof code === 'string' && CODE_PATTERN.test(code);
}

export function getAllCodes(registry: QrCode[] = registryData as QrCode[]): QrCode[] {
  return registry;
}

export function resolveCode(
  code: string,
  registry: QrCode[] = registryData as QrCode[],
): { status: CodeStatus; partner_slug: string | null } {
  const entry = registry.find((c) => c.code === code);
  if (!entry) return { status: 'unknown', partner_slug: null };
  if (entry.partner_slug) return { status: 'assigned', partner_slug: entry.partner_slug };
  return { status: 'unassigned', partner_slug: null };
}
