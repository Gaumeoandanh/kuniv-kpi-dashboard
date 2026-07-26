// Session token: signed with Web Crypto (HMAC-SHA256), not Node's
// `crypto` module — this file is imported by middleware.ts, which runs in
// the Edge Runtime and does not support Node built-ins. Web Crypto
// (`crypto.subtle`) is available in both Node and Edge, so this works
// everywhere without extra dependencies.

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const SESSION_COOKIE_NAME = "kuniv_session";
export const SESSION_COOKIE_MAX_AGE = SESSION_MAX_AGE_SECONDS;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64url: string): Uint8Array {
  const padded = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(b64url.length / 4) * 4,
    "="
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set. Add it to your environment variables.");
  }
  return secret;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(): Promise<string> {
  const payload = JSON.stringify({
    iat: Date.now(),
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });
  const payloadB64 = toBase64Url(encoder.encode(payload));
  const key = await getHmacKey(getSessionSecret());
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64) as BufferSource
  );
  const sig = toBase64Url(new Uint8Array(sigBuf));
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;

  try {
    const key = await getHmacKey(getSessionSecret());
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(sig) as BufferSource,
      encoder.encode(payloadB64) as BufferSource
    );
    if (!valid) return false;

    const payload = JSON.parse(decoder.decode(fromBase64Url(payloadB64)));
    if (typeof payload.exp !== "number") return false;
    return Date.now() < payload.exp;
  } catch {
    return false;
  }
}
