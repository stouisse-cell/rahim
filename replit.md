# Rahim International — Web Artifact

## Overview

Trilingual (EN / FR / AR) static marketing site for **Rahim International**, a real-estate advisory firm operating in the Rabat-Salé-Kénitra market in Morocco. The site is plain HTML/CSS/JS — no framework, no backend.

## Stack

- **Bundler / dev server**: Vite 7 (multi-page mode)
- **Styling**: a single shared stylesheet (`shared.css`) using CSS custom properties + media queries
- **Scripts**: a single shared script (`shared.js`) loaded by every page
- **No React, no TypeScript app code** — `tsconfig.json` is only there for editor support

## Structure

```
artifacts/web/
├─ index.html, about.html, contact.html, ...   ← English pages
├─ fr/        ← French pages (mirror of English)
├─ ar/        ← Arabic pages (RTL, dir="rtl")
├─ guides/    ← Buying guides (also mirrored under fr/guides, ar/guides)
├─ shared.css ← global stylesheet (loaded by every page)
├─ shared.js  ← global scripts (nav, reveal, gallery, forms, …)
└─ vite.config.ts ← collects every .html file as an entry
```

`vite.config.ts` walks the artifact root recursively and registers every `.html` file as a Rollup input, so the multi-language tree is served and built without per-page configuration.

## Mobile responsiveness — what was changed

The original CSS only switched to a hamburger menu at `≤680px`. Between roughly 681px and 1180px the desktop nav links wrapped onto two lines, the breadcrumb sat behind the fixed nav, and the homepage hero crowded the floating WhatsApp / scroll buttons. The fixes live near the bottom of `shared.css` and in the `setNavOpen()` helper in `shared.js`:

- Hamburger now triggers at `≤1024px`; nav height drops to 72px on mobile.
- Mobile menu is `position: fixed`, fills the viewport below the nav, scrolls internally (`max-height: 100dvh - 72px`) and sits above the hero (`z-index: 99`).
- Opening the menu adds `body.nav-open` which locks background scroll. `Escape`, outside-click, link-click, and resize past 1024px all close the menu.
- The standalone "Enquire" CTA next to the hamburger is hidden on mobile (the same link appears inside the open menu).
- Breadcrumb pages get an extra `margin-top` below 1180px so they clear the fixed nav.
- The vertical "Scroll" indicator on the homepage hero is hidden below 900px so it stops overlapping the floating action buttons.
- Hero title uses a smaller `clamp()` floor on phones; long Arabic words now `overflow-wrap: break-word` to prevent horizontal scroll on `/ar/*`.
- `html, body { overflow-x: hidden; max-width: 100vw }` as a final guard against runaway horizontal scroll (mostly an RTL concern).
- The "Real Estate Developers" card on the homepage previously used inline `grid-template-columns: minmax(0,1fr) minmax(280px,.7fr)` which on phones crushed the left column and made the heading wrap one word per line. The inline grid was replaced with a `.developers-card` class that switches to a single column at `≤900px`. Same treatment applied to the English, French, and Arabic homepages (the Arabic variant uses an `.developers-aside` feature-list card on the right instead of buttons).

## Known: missing assets

The original upload did not include `logo.png`, `hero.mp4`, `hero-poster.jpg`, or the `elaf*.jpg` gallery images. Pages that reference them will show broken-image placeholders until those files are added back to `artifacts/web/`. This is purely a missing-asset issue, not a layout bug.

## Dev / build

- Dev: workflow `artifacts/web: web` runs `vite --config vite.config.ts --host 0.0.0.0` on the assigned `PORT`.
- Build: `pnpm --filter @workspace/web run build` (requires `PORT` and `BASE_PATH` env vars; the deployment runner sets these automatically).
