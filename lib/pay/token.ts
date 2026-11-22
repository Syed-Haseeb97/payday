import crypto from 'crypto';

/**
 * Generates a cryptographically secure URL-safe payment token.
 * Uses 24 random bytes base64url-encoded to produce 32 URL-safe characters: [A-Za-z0-9_-].
 * Guaranteed length >= 24 chars.
 */
export function generatePayToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

/**
 * Deterministically generates a URL-safe token from an invoice ID for stable seed data.
 */
export function generateDeterministicPayToken(invoiceId: string): string {
  return crypto
    .createHash('sha256')
    .update(`payday_seed_token_${invoiceId}`)
    .digest('base64url')
    .slice(0, 32);
}

/**
 * Validates if a string is a valid pay token format (at least 24 chars, base64url characters only).
 */
export function isValidPayToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  if (token.length < 24) return false;
  return /^[A-Za-z0-9_-]+$/.test(token);
}

/**
 * Constructs the absolute pay link URL for an invoice token.
 */
export function getPayLinkUrl(token: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/pay/${token}`;
}
