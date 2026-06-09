import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { kvGet, kvSet } from './kv';

const REVOKE_STORE = 'revocations';

export interface AccessTokenPayload {
  email: string;
  guide_slugs: string[];
  stripe_session_id: string;
  partner_id: string | null;
}

export interface VerifiedTokenPayload extends AccessTokenPayload {
  iat: number;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 chars long');
  }
  return secret;
}

function csvEnvSet(name: string): Set<string> {
  return new Set(
    (process.env[name] || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function tokenRevocationHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function isRevoked(token: string, decoded: VerifiedTokenPayload): Promise<boolean> {
  // Legacy env-var revocation lists (still honored).
  if (csvEnvSet('JWT_REVOKED_TOKEN_HASHES').has(tokenRevocationHash(token))) return true;
  if (csvEnvSet('JWT_REVOKED_SESSION_IDS').has(decoded.stripe_session_id)) return true;

  // Shared store revocation — revocable at runtime without a redeploy and
  // without an unbounded env-var list.
  if (await kvGet(REVOKE_STORE, `token:${tokenRevocationHash(token)}`)) return true;
  if (await kvGet(REVOKE_STORE, `session:${decoded.stripe_session_id}`)) return true;

  return false;
}

/**
 * Generate a signed JWT for buyer access. No expiry — access is "permanent"
 * (matches the buyer-facing promise) until explicitly revoked via the store.
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getSecret(), { algorithm: 'HS256' });
}

/**
 * Verify a JWT and return its payload, or null if invalid/corrupted/revoked.
 * Never throws — use null check.
 */
export async function verifyAccessToken(
  token: string | null | undefined,
): Promise<VerifiedTokenPayload | null> {
  if (!token || typeof token !== 'string') return null;
  try {
    const decoded = jwt.verify(token, getSecret()) as VerifiedTokenPayload;
    if (await isRevoked(token, decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Revoke a single access token at runtime (stored in the shared KV). */
export async function revokeToken(token: string): Promise<void> {
  await kvSet(REVOKE_STORE, `token:${tokenRevocationHash(token)}`, '1');
}

/** Revoke every token issued for a given Stripe session id. */
export async function revokeSession(sessionId: string): Promise<void> {
  await kvSet(REVOKE_STORE, `session:${sessionId}`, '1');
}
