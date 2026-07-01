// Native password hashing and session utilities for Cloudflare Workers / Pages Functions

const PBKDF2_ITERATIONS = 100000;
const HASH_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16; // 128 bits

// Generate timing-safe random hex string
export function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Timing-safe password hashing using PBKDF2
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  const hashBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    baseKey,
    HASH_LENGTH * 8
  );
  
  const saltHex = Array.from(salt, byte => byte.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hashBits), byte => byte.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}.${hashHex}`;
}

// Timing-safe verification
export async function verifyPassword(password, storedHashAndSalt) {
  const parts = storedHashAndSalt.split('.');
  if (parts.length !== 2) return false;
  
  const [saltHex, storedHashHex] = parts;
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  const hashBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    baseKey,
    HASH_LENGTH * 8
  );
  
  const computedHashHex = Array.from(new Uint8Array(hashBits), byte => byte.toString(16).padStart(2, '0')).join('');
  
  // Timing-safe comparison
  return timingSafeEqual(computedHashHex, storedHashHex);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Format Session Cookie Header
export function serializeSessionCookie(token, expiresAt) {
  // Use Secure, HttpOnly, SameSite=Lax
  // Note: __Host- prefix requires the cookie to be set on a secure HTTPS domain with path=/
  // During local development over http://localhost, some browsers might reject __Host- prefix, 
  // so we'll use a standard cookie name but secure attributes, or __Secure- if not localhost.
  const cookieName = "__Secure-Session";
  const dateStr = new Date(expiresAt * 1000).toUTCString();
  return `${cookieName}=${token}; Path=/; Expires=${dateStr}; HttpOnly; Secure; SameSite=Lax`;
}

// Parse Cookie Header
export function parseCookies(headers) {
  const list = {};
  const cookieHeader = headers.get("Cookie");
  if (!cookieHeader) return list;

  cookieHeader.split(";").forEach(cookie => {
    let [name, ...rest] = cookie.split("=");
    name = name.trim();
    if (!name) return;
    const val = rest.join("=").trim();
    list[name] = decodeURIComponent(val);
  });
  
  return list;
}
