# twoleavestea — Local Static Site

This repository is a local copy / learning clone of the Two Leaves & A Bud storefront landing page. It contains a static HTML/CSS/JS implementation with third-party libraries used for the carousel, animations and a small interactive footer.

## Purpose

- Keep a working local copy for learning, experimentation, and design tweaks.
- Practice responsive layout, CSS architecture, and small JavaScript interactions (GSAP, Flickity, Alpine).

## Features

- Responsive hero carousel using Flickity.
- Sticky navbar that toggles an `active` class via GSAP ScrollTrigger (scroll-based animation).
- Animated placeholder text in the search/input area.
- Footer accordion controlled with Alpine.js for small-screen expand/collapse behavior.
- Local font loading (fonts are under `assets/fonts/`) and a themed color system in CSS.

## Files & Structure

Top-level files you'll work with:

- `index.html` — Primary HTML entry (references `style.css` and `script.js`).
- `style.css` — Primary stylesheet (the project contains two CSS variants: `style.css` and `new.css`).
- `script.js` — Main JS (contains GSAP, placeholder animation, and footer accordion logic).
- `assets/` — Fonts and images.

Recommended structure (already present):

- assets/
  - fonts/
  - images/
- index.html
- style.css
- script.js

## Dependencies (CDNs used)

- Flickity (carousel): https://unpkg.com/flickity
- GSAP + ScrollTrigger (scroll animations): https://cdnjs.cloudflare.com
- Alpine.js (footer accordion reactive behavior): https://cdn.jsdelivr.net

These are included via <script> / <link> tags in the HTML files — no npm setup required for a lightweight local preview.

## Quick Start — Open Locally

1. Option A — Open in browser
   - Double-click `index.html` or open it from your browser (`File → Open File...`).

2. Option B — Use VS Code Live Server (recommended)
   - Install the Live Server extension.
   - Open the workspace in VS Code and run Live Server on `index.html`.

3. Troubleshooting fonts
   - The CSS expects fonts in `assets/fonts/`. If fonts are missing, the page will fall back to system fonts. To avoid CORS issues, use Live Server rather than opening the file directly in some browsers.

## Recent fixes & migration notes

While copying files between `new.html`/`new.css` and `index.html`/`style.css` you may run into small mismatches — here are the fixes already applied and recommended choices:

- Added `class="navbar"` to the `<nav>` element in `index.html` so the `.navbar` CSS rules apply correctly.
- Fixed a typo: `location.herf` → `location.href` on the section button click handler.
- Normalized CSS class naming: `nabar-` → `navbar-` (several class names were misspelled in `new.css` and `new.html`).

Naming choices to resolve (pick one):

1. Keep `index.html` as the main entry and copy `new.css` → `style.css` and `new.js` → `script.js` (recommended if `new.*` contains the finalized styles/logic).
2. Or update `index.html` to reference `new.css` and `new.js` instead of `style.css`/`script.js`.

Either approach is valid — let me know which you prefer and I can perform the copy or update references for you.

## Development tips

- Use the browser console to inspect missing resources (404s) — common issues are font paths and images.
- When editing CSS, prefer `style.css` as the canonical stylesheet unless you decide to fully switch to `new.css`.
- If you want to bundle or version assets later, consider a small build step (e.g., npm + Parcel/Vite) but that isn't necessary for local previews.

## How to contribute / next steps

- If you want, I can:
  - Copy `new.css` and `new.js` over `style.css` / `script.js` to make the new styles active immediately.
  - Update `index.html` to reference the `new.*` files instead.
  - Remove duplicate files after you confirm the final naming.

Tell me which naming approach you prefer and I'll update the repo accordingly.

## License

This is a personal learning copy. Add an appropriate license if you plan to publish or share it.
