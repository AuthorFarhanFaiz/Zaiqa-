import { json } from "../_lib/auth.js";

// Staff view: GET /api/admin-orders?key=YOUR_ADMIN_KEY
// The key is set as the ADMIN_KEY environment variable (secret, not in code).
// This is a simple shared-secret check, adequate for one staff dashboard —
// it is NOT a substitute for real user accounts if multiple staff need
// separate logins later.
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || request.headers.get("X-Admin-Key") || "";

  if (!env.ADMIN_KEY) return json({ error: "Admin access not configured. Set ADMIN_KEY in your Pages environment variables." }, 500);
  if (key !== env.ADMIN_KEY) return json({ error: "Unauthorized." }, 401);
  if (!env.ZAIQA_ORDERS) return json({ orders: [] });

  const list = await env.ZAIQA_ORDERS.list({ prefix: "order:", limit: 100 });
  const orders = [];
  for (const k of list.keys) {
    const raw = await env.ZAIQA_ORDERS.get(k.name);
    if (raw) orders.push(JSON.parse(raw));
  }
  orders.sort((a, b) => b.createdAt - a.createdAt);
  return json({ orders });
}
