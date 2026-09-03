// Shared helpers used by every /api function. Not itself a route (starts with _).

export function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...headers } });
}

export function isSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export function clean(s, max) { return (s || "").toString().trim().slice(0, max); }

export function escapeHtml(s) {
  return (s || "").toString()
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

export async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 150000, hash: "SHA-256" },
    keyMaterial, 256
  );
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function sign(value, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Verifies the zp_session cookie and returns the logged-in email, or null.
export async function getSessionEmail(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/zp_session=([^;]+)/);
  if (!match) return null;
  const token = decodeURIComponent(match[1]);
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [email, expiry, sig] = parts;
  const secret = env.SESSION_SECRET || "dev-secret-change-me";
  const expected = await sign(`${email}.${expiry}`, secret);
  if (expected !== sig) return null;
  if (Date.now() > Number(expiry)) return null;
  return email;
}

// Simple fixed-window rate limiter backed by KV. Returns true if the request
// should be BLOCKED (limit exceeded).
export async function isRateLimited(env, kvNamespace, key, limit, windowSeconds) {
  const kv = env[kvNamespace];
  if (!kv) return false; // fail-open only when KV isn't configured yet
  const count = parseInt((await kv.get(key)) || "0", 10);
  if (count >= limit) return true;
  await kv.put(key, String(count + 1), { expirationTtl: windowSeconds });
  return false;
}
