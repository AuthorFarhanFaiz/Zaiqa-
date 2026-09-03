import { json, isSameOrigin, clean, isValidEmail, hashPassword, escapeHtml, isRateLimited } from "../_lib/auth.js";

async function sendConfirmationEmail(env, name, email) {
  if (!env.RESEND_API_KEY) return;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#1B1512;padding:32px;color:#F4EEE2;">
      <div style="max-width:480px;margin:0 auto;background:#241a15;border:1px solid #C9974C55;border-radius:6px;padding:32px;">
        <h1 style="color:#C9974C;font-size:22px;margin:0 0 12px;">Welcome to Zaiqa Restaurant</h1>
        <p style="line-height:1.6;">Hi ${escapeHtml(name) || "there"},</p>
        <p style="line-height:1.6;">Your account has been created with <strong>${escapeHtml(email)}</strong>. You can now log in to place orders and track them.</p>
        <p style="line-height:1.6;color:#c9bba9;font-size:13px;">If you didn't create this account, please ignore this email.</p>
        <p style="margin-top:28px;color:#c9bba9;font-size:13px;">— Zaiqa Restaurant</p>
      </div>
    </div>`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM || "Zaiqa Restaurant <onboarding@resend.dev>", to: email, subject: "Welcome to Zaiqa Restaurant", html })
    });
  } catch (e) { /* never block signup on email failure */ }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!isSameOrigin(request)) return json({ error: "Blocked cross-site request." }, 403);

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (await isRateLimited(env, "ZAIQA_USERS", "ratelimit:signup:" + ip, 8, 3600)) {
    return json({ error: "Too many signup attempts from this network. Try again later." }, 429);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request" }, 400); }

  if (clean(body.website, 50)) return json({ ok: true }); // honeypot field — bots fill it, humans don't

  const name = clean(body.name, 80);
  const email = clean(body.email, 120).toLowerCase();
  const phone = clean(body.phone, 20);
  const password = (body.password || "").toString();

  if (!name || !isValidEmail(email) || password.length < 8) {
    return json({ error: "Please provide a valid name, email, and a password of at least 8 characters." }, 400);
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return json({ error: "Password should include at least one letter and one number." }, 400);
  }

  if (!env.ZAIQA_USERS) {
    return json({ ok: true, warning: "KV not configured — account was not saved. See SETUP.md." });
  }

  const existing = await env.ZAIQA_USERS.get("user:" + email);
  if (existing) return json({ error: "An account with this email already exists." }, 409);

  const salt = crypto.randomUUID();
  const passwordHash = await hashPassword(password, salt);
  await env.ZAIQA_USERS.put("user:" + email, JSON.stringify({ name, email, phone, salt, passwordHash, createdAt: Date.now() }));

  await sendConfirmationEmail(env, name, email);
  return json({ ok: true });
}
