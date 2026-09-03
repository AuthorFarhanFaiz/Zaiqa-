import { json, isSameOrigin, clean, escapeHtml, getSessionEmail, isRateLimited } from "../_lib/auth.js";

async function notifyNewOrder(env, order) {
  if (!env.RESEND_API_KEY || !env.ORDER_NOTIFY_EMAIL) return;
  const itemsHtml = order.items.map(i => `<li>${escapeHtml(i.qty)} × ${escapeHtml(i.name)}</li>`).join("");
  const html = `
    <div style="font-family:Arial,sans-serif;background:#1B1512;padding:32px;color:#F4EEE2;">
      <div style="max-width:520px;margin:0 auto;background:#241a15;border:1px solid #C9974C55;border-radius:6px;padding:32px;">
        <h1 style="color:#C9974C;font-size:20px;margin:0 0 16px;">New Order — ${escapeHtml(order.id)}</h1>
        <p><strong>Branch:</strong> ${escapeHtml(order.branch)}</p>
        <p><strong>Name:</strong> ${escapeHtml(order.name)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(order.phone)}</p>
        <p><strong>Items:</strong></p>
        <ul>${itemsHtml}</ul>
        <p><strong>Notes:</strong> ${escapeHtml(order.notes) || "—"}</p>
        <p><strong>Delivery address:</strong> ${escapeHtml(order.address)}</p>
        <p><strong>Payment method:</strong> ${escapeHtml(order.payment_method)}${order.advance_percent ? ` (${order.advance_percent}% advance required)` : ""}</p>
        <p><strong>Transaction ref:</strong> ${escapeHtml(order.transaction_ref) || "— not sent yet, follow up by phone/WhatsApp"}</p>
        ${order.lat && order.lng ? `<p><strong>Customer location:</strong> <a href="https://maps.google.com/?q=${order.lat},${order.lng}" style="color:#C9974C;">View on map</a></p>` : ""}
      </div>
    </div>`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM || "Zaiqa Restaurant <onboarding@resend.dev>", to: env.ORDER_NOTIFY_EMAIL, subject: "New order " + order.id, html })
    });
  } catch (e) { /* never block the order on email failure */ }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!isSameOrigin(request)) return json({ error: "Blocked cross-site request." }, 403);

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (await isRateLimited(env, "ZAIQA_ORDERS", "ratelimit:order:" + ip, 12, 3600)) {
    return json({ error: "Too many orders placed from this network. Please call the branch directly or try again later." }, 429);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request" }, 400); }
  if (clean(body.website, 50)) return json({ ok: true }); // honeypot

  const items = Array.isArray(body.items) ? body.items.slice(0, 40).map(i => ({
    name: clean(i.name, 80),
    qty: Math.max(1, Math.min(20, parseInt(i.qty, 10) || 1))
  })).filter(i => i.name) : [];

  const validPayments = ["cod", "jazzcash", "easypaisa", "bank"];
  const order = {
    id: crypto.randomUUID().slice(0, 8).toUpperCase(),
    branch: clean(body.branch, 40) || "Not specified",
    name: clean(body.name, 80),
    phone: clean(body.phone, 20),
    items,
    notes: clean(body.notes, 400),
    address: clean(body.address, 300),
    payment_method: validPayments.includes(body.payment_method) ? body.payment_method : null,
    transaction_ref: clean(body.transaction_ref, 100),
    advance_percent: Math.max(0, Math.min(100, parseInt(body.advance_percent, 10) || 0)),
    lat: typeof body.lat === "number" && body.lat >= -90 && body.lat <= 90 ? body.lat : null,
    lng: typeof body.lng === "number" && body.lng >= -180 && body.lng <= 180 ? body.lng : null,
    createdAt: Date.now()
  };
  // Transaction ref is optional at order time — the amount isn't known until
  // staff confirm the total by phone (menu has no listed prices), so the
  // customer sends the 50% advance and reference afterwards, by phone or WhatsApp.

  if (!order.name || !order.phone || items.length === 0 || !order.address || !order.payment_method) {
    return json({ error: "Missing required fields — name, phone, at least one item, address and payment method are mandatory." }, 400);
  }
  if (!/^[0-9+\-\s]{7,20}$/.test(order.phone)) {
    return json({ error: "Please enter a valid phone number." }, 400);
  }

  const email = await getSessionEmail(request, env);
  order.customerEmail = email || null;

  if (env.ZAIQA_ORDERS) {
    await env.ZAIQA_ORDERS.put("order:" + order.id, JSON.stringify(order), { expirationTtl: 60 * 60 * 24 * 180 });
    if (email) {
      const idxKey = "orders-by-user:" + email;
      const existingIds = JSON.parse((await env.ZAIQA_ORDERS.get(idxKey)) || "[]");
      existingIds.unshift(order.id);
      await env.ZAIQA_ORDERS.put(idxKey, JSON.stringify(existingIds.slice(0, 50)));
    }
  }

  await notifyNewOrder(env, order);
  return json({ ok: true, orderId: order.id });
}
