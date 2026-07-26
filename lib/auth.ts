import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Password hashing only — uses Node's `crypto` module, so this file must
// only be imported from Node.js runtime code (API routes), never from
// middleware.ts (Edge Runtime). Session token logic lives in lib/session.ts,
// which is Edge-safe.

/**
 * Password hashing (scrypt, Node built-in — no extra native dependency).
 * Run `npm run hash-password -- "yourPassword"` to generate DASHBOARD_PASSWORD_HASH.
 * Format stored in env: "<saltHex>:<hashHex>"
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hashHex, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
