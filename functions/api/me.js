import { json, getSessionEmail } from "../_lib/auth.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  const email = await getSessionEmail(request, env);
  if (!email) return json({ loggedIn: false });

  if (!env.ZAIQA_USERS) return json({ loggedIn: false });
  const raw = await env.ZAIQA_USERS.get("user:" + email);
  if (!raw) return json({ loggedIn: false });
  const user = JSON.parse(raw);
  return json({ loggedIn: true, name: user.name, email: user.email });
}
