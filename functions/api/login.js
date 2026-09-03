import { json, isSameOrigin, hashPassword, sign, isRateLimited } from "../_lib/auth.js";

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!isSameOrigin(request)) return json({ error: "Blocked cross-site request." }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request" }, 400); }

  const email = (body.email || "").toString().trim().toLowerCase();
  const password = (body.password || "").toString();
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  if (!env.ZAIQA_USERS) return json({ error: "Accounts aren't configured yet. See SETUP.md." }, 500);

  // Per email+IP lockout (5 tries / 15 min) AND a looser per-IP limit so one
  // attacker can't just rotate emails against the same IP.
  const lockKey = "lock:" + email + ":" + ip;
  const attempts = parseInt((await env.ZAIQA_USERS.get(lockKey)) || "0", 10);
  if (attempts >= 5) return json({ error: "Too many failed attempts. Please try again in 15 minutes." }, 429);
  if (await isRateLimited(env, "ZAIQA_USERS", "ratelimit:login-ip:" + ip, 30, 900)) {
    return json({ error: "Too many login attempts from this network. Try again later." }, 429);
  }

  const raw = await env.ZAIQA_USERS.get("user:" + email);
  const fail = async () => {
    await env.ZAIQA_USERS.put(lockKey, String(attempts + 1), { expirationTtl: 900 });
    return json({ error: "Incorrect email or password." }, 401);
  };

  if (!raw) return fail();
  const user = JSON.parse(raw);
  const attemptHash = await hashPassword(password, user.salt);
  if (attemptHash.length !== user.passwordHash.length || attemptHash !== user.passwordHash) return fail();

  await env.ZAIQA_USERS.delete(lockKey);

  const secret = env.SESSION_SECRET || "dev-secret-change-me";
  const payload = `${email}.${Date.now() + 1000 * 60 * 60 * 24 * 30}`;
  const sig = await sign(payload, secret);
  const token = `${payload}.${sig}`;

  return json(
    { ok: true, name: user.name },
    200,
    { "Set-Cookie": `zp_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` }
  );
}
