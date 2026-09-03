import { json, isSameOrigin } from "../_lib/auth.js";

export async function onRequestPost(context) {
  const { request } = context;
  if (!isSameOrigin(request)) return json({ error: "Blocked cross-site request." }, 403);
  return json({ ok: true }, 200, {
    "Set-Cookie": "zp_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
  });
}
