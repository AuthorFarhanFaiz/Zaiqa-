import { json, getSessionEmail } from "../_lib/auth.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  const email = await getSessionEmail(request, env);
  if (!email) return json({ error: "Please log in to view your orders." }, 401);
  if (!env.ZAIQA_ORDERS) return json({ orders: [] });

  const ids = JSON.parse((await env.ZAIQA_ORDERS.get("orders-by-user:" + email)) || "[]");
  const orders = [];
  for (const id of ids.slice(0, 20)) {
    const raw = await env.ZAIQA_ORDERS.get("order:" + id);
    if (raw) orders.push(JSON.parse(raw));
  }
  return json({ orders });
}
