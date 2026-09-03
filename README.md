# Zaiqa Restaurant — Unified Website

A single, fresh build combining real content from all branches (Bahawalpur,
Sadiqabad, Daharki, Mirpur Mathelo, Qaswa Cafe) with a custom "highway route"
design — plain HTML/CSS/JS, no framework, no external dependencies (works
free on any static host including Cloudflare Pages, Netlify, GitHub Pages).

## Deploy to Cloudflare Pages
1. Cloudflare dashboard → Workers & Pages → Create → Pages → Upload assets.
2. Upload everything in this folder (or the zip).
3. Deploy — no build command needed, this is a static site.
4. Add your custom domain in Pages → Settings.

## Structure
- index.html — all sections (hero, story, branches, menu, events, gallery, Qaswa Cafe, contact)
- styles.css — all design tokens/styles
- script.js — mobile nav, gallery + menu-scan rendering, lightbox
- images/ — real branch & food photography
- menu/ — real printed menu scans per branch

## Before going fully live
- Confirm with the restaurant owner that these exact photos/logo/menu scans
  are approved for the public website (per your contract).
- Swap in higher-resolution originals if the owner can provide them.
- Add real Google Maps links / embedded map once you have exact pins.
- Hours, banquet capacities and current prices should be confirmed branch by
  branch before publishing (see the original research pack notes).
