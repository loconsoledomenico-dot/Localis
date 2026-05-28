import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';

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

function isRevoked(token: string, decoded: VerifiedTokenPayload): boolean {
  const revokedTokenHashes = csvEnvSet('JWT_REVOKED_TOKEN_HASHES');
  if (revokedTokenHashes.has(tokenRevocationHash(token))) return true;

  const revokedSessionIds = csvEnvSet('JWT_REVOKED_SESSION_IDS');
  return revokedSessionIds.has(decoded.stripe_session_id);
}

/**
 * Generate a signed JWT for buyer access. No expiry — token is "permanent" until manually revoked.
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getSecret(), { algorithm: 'HS256' });
}

/**
 * Verify a JWT and return its payload, or null if invalid/corrupted.
 * Never throws — use null check.
 */
export function verifyAccessToken(token: string | null | undefined): VerifiedTokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const decoded = jwt.verify(token, getSecret()) as VerifiedTokenPayload;
    if (isRevoked(token, decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}
