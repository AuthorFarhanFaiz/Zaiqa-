# Zaiqa Restaurant — Setup Guide

This site is static HTML/CSS/JS + Cloudflare Pages Functions for
accounts/orders. No paid plan needed — everything below is on Cloudflare's
free tier.

## 0. Before deploying — one placeholder to fix
`index.html` has `<meta property="og:image" content="https://zaiqarestaurant.pk/...">`
— this is the image WhatsApp/Facebook/Google show as a preview when your
link is shared or searched. **Replace `zaiqarestaurant.pk` with whatever
domain you actually deploy to** (or your `*.pages.dev` address) once you
know it, otherwise the preview image won't load.

## 1. Deploy
Cloudflare dashboard → Workers & Pages → Create → Pages → Upload assets →
upload this whole folder (or the zip). No build command needed.

## 2. Required — KV namespaces (for accounts & orders to actually save)
Workers & Pages → KV → Create namespace, twice:
- `ZAIQA_USERS`
- `ZAIQA_ORDERS`

Then: your Pages project → Settings → Functions → KV namespace bindings →
bind variable name `ZAIQA_USERS` to the `ZAIQA_USERS` namespace, and
`ZAIQA_ORDERS` to `ZAIQA_ORDERS`. Without this, login/signup/orders will
respond but won't actually save anything.

## 3. Required — environment variables (Settings → Environment variables)
- `SESSION_SECRET` — any long random string (e.g. generate one at
  https://1password.com/password-generator/). Keeps login sessions secure.
  **Do not reuse a password you use elsewhere.**
- `ADMIN_KEY` — another long random string. This is how staff view orders
  (see step 5). Keep it private — anyone with this key can see all orders.

## 4. Order alerts — the free way (recommended, zero cost)
You now have **two independent ways** to hear about a new order the moment
it's placed — use both, they don't conflict:

**A) WhatsApp (instant, no setup, always works)**
When a customer places an order, they immediately see a
"Send order details on WhatsApp" button that opens WhatsApp pre-filled with
the order — addressed to that branch's WhatsApp number (already wired up
in `script.js` → `BRANCH_WHATSAPP`, using the real branch phone numbers).
There's also a floating WhatsApp button on every page for general
questions. **Nothing to configure — this works today.**

**B) Email (free, but needs one small step to reach customers/you reliably)**
Resend's free tier (100 emails/day) will only send to arbitrary addresses
once you verify a domain — BUT it will always send, for free, straight to
**your own Resend account email** with zero extra setup. So:
1. Create a free account at https://resend.com using the **restaurant's own
   business email** (e.g. the email the owner checks daily).
2. Add environment variables:
   - `RESEND_API_KEY` — from Resend
   - `ORDER_NOTIFY_EMAIL` — set this to that **exact same email** you signed
     up with. This combination works immediately, free, no domain needed.
   - `EMAIL_FROM` can stay as the default.
3. If later you also want the customer-facing "welcome" signup email to go
   out (nice-to-have, not required — signup works fine without it), verify
   a real domain in Resend and switch `EMAIL_FROM` to that domain.

If you skip email setup entirely, orders still save correctly and the
WhatsApp button covers instant notification — email is a backup, not a
dependency.

## 4b. Location accuracy — what's built in, and the real limit
Customers can type their address manually (always works), or tap
**"Use my current location"**, which:
- Asks the browser for GPS coordinates (`enableHighAccuracy: true`).
- Converts coordinates to a readable address (free, via OpenStreetMap —
  no API key/cost).
- If the typed address and the detected address point to a **different
  known area** (e.g. typed "Sadiqabad" but device shows "Karachi"), the
  customer is asked **once**, clearly, which one to use — it never
  silently overrides what they typed.
- Shows the GPS accuracy radius, and warns if it's low (>2km).

**Why "current location" sometimes shows the wrong city:** this is a
browser/device limitation, not something a website can code around. When a
device can't get a real GPS fix (no GPS chip, GPS turned off, indoors,
browser only granted "approximate" location, or on a desktop with no GPS
at all), the browser falls back to **network-based positioning** —
estimating location from Wi-Fi/cell towers or the IP address's registered
region, which can be off by hundreds of kilometers, especially over mobile
data. The fix is on the customer's device, not the code:
- Use a phone, not a desktop browser.
- Turn on **Location Services** (not just browser permission) and choose
  **Precise/High Accuracy** location mode in phone settings.
- Grant the browser **"Precise location"** when prompted (not
  "Approximate").
- Try again outdoors or near a window if the first attempt is inaccurate.

Typing the address manually is always the reliable fallback — that's why
it's the primary field, with GPS as an optional assist.

## 5. Staff order dashboard
Visit: `https://yourdomain.com/api/admin-orders?key=YOUR_ADMIN_KEY`
(the `ADMIN_KEY` from step 3). This returns the most recent orders as JSON.
It's basic on purpose — good enough for one staff member to check on a
phone. Bookmark the URL with your key already in it, but don't share that
link publicly.

## 6. Payments — important, please read
This site does **not** process real online payments. There is no card
gateway. For delivery orders, customers choose:
- **Cash on Delivery** — no advance required.
- **JazzCash / Easypaisa / Bank Transfer** — a **50% advance** is required.
  Since the menu is only scanned images (no listed prices online), the
  exact amount isn't known at checkout — so the flow is: customer places
  the order → staff calls to confirm the total → customer sends 50% to the
  branch's number → customer replies with the transaction reference,
  either in the order (optional field) or over WhatsApp (one tap, via the
  "Send order details on WhatsApp" button shown right after ordering).
  Staff should **not** hand over/start delivery until the reference is
  verified.

This is intentional and matches what's realistic for a free setup:
- Real card/payment-gateway integration (Stripe, PayFast, JazzCash business
  API, etc.) requires a **paid merchant account**, business verification,
  and processing fees — not available for free, and beyond what a website
  can safely do without a licensed payment processor in the loop.
- Never build a payment form that collects raw card numbers yourself
  unless it goes directly through a licensed processor's secure fields —
  handling card numbers directly creates serious security and compliance
  liability.

If you outgrow manual payments later, look at JazzCash/Easypaisa's
official merchant/business APIs, or a hosted checkout provider — that's a
separate, paid integration project.

## 7. Security already built in
- Passwords: hashed with PBKDF2 (150,000 iterations) + per-user salt —
  never stored in plain text.
- Sessions: signed, HttpOnly, Secure, SameSite cookies (JS on the page
  can't read or forge them).
- Login: locks out an email+IP after 5 wrong attempts for 15 minutes.
- All forms: honeypot field blocks basic bots; same-origin check blocks
  requests from other websites; every field is length-limited and validated
  server-side (never trust the browser alone).
- Order/signup/login endpoints are rate-limited per IP.
- Security headers (`_headers` file): CSP, HSTS, X-Frame-Options, etc.
- No card numbers are ever collected or stored (see §6).

## 8. Things you're probably still missing — please action before going live
- **Owner sign-off on real photos/logo/menu** (see the earlier note — this
  site uses Zaiqa's real branding and scanned menus; get written
  confirmation from the owner that this is authorized).
- **Terms & Privacy pages** (`terms.html`, `privacy.html`) are included but
  are placeholders — have the owner review and finalize the actual policy
  (refund window, cancellation rules, etc.) before publishing.
- ~~A real support channel~~ — done: floating WhatsApp button + order
  hand-off (see §4A). **Before launch: replace the placeholder branch
  numbers in `script.js` → `BRANCH_WHATSAPP` with the numbers that are
  actually active on WhatsApp** (a phone number can ring but not have
  WhatsApp set up — test each one).
- **Menu prices**: nothing on the site is priced — customers only see
  scanned menu images. If you want real add-to-cart pricing later, someone
  will need to type up an actual priced menu (structured data), not just
  photos.
- **Domain + SSL**: Cloudflare Pages gives you a free `*.pages.dev` domain
  with HTTPS automatically; buy and connect a real domain when ready.
- **Backups**: KV data (accounts/orders) isn't automatically exported —
  periodically pull orders via the admin endpoint and save them somewhere
  if you need long-term records (orders auto-expire after 180 days).
- **Multiple staff logins**: the admin dashboard uses one shared key. If
  more than one person needs access with individual accountability, that's
  a bigger feature to build later.
