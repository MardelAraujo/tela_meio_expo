# Automind Design System

Automind is a brand identity centered on a stylized **M** monogram and the tagline **"Simple · Smart · Reliable"**. The system is energetic and modern: a hot pink → magenta → deep purple → navy gradient over high-contrast black/white surfaces, paired with a confident geometric sans-serif (Hando) for display and a clean neo-grotesque (Red Hat Display) for body copy.

This repository is a brand kit and UI component library for designing Automind interfaces, marketing pages, and slide decks at high fidelity.

## Source material

The system was reconstructed from a single Figma file:

- **File:** `Automind.fig` (mounted as a virtual filesystem during construction)
- **Page:** `Page-1` — 14 top-level frames covering logo lockups, color swatches, typography specimen, the gradient, and an icon plate.

The file did not include a codebase, real product screens, or finished marketing pages — so the UI kit is a **plausible expression of the brand applied to product surfaces**, faithful to the visual foundations the file does define (color, type, logo, gradient, supporting iconography).

## What's in this folder

| File / folder | What it is |
| --- | --- |
| `README.md` | This file — brand context, content fundamentals, visual foundations, iconography. |
| `SKILL.md` | Agent-Skills front-matter so this kit can be invoked as a skill. |
| `colors_and_type.css` | Design tokens — colors, fonts, sizes, semantic styles. |
| `fonts/` | Webfont files (TTF/WOFF) and Google Fonts fallbacks. |
| `assets/` | Logos, brand imagery, illustrations, icon plate. |
| `preview/` | Small HTML cards previewed in the Design System tab. |
| `ui_kits/marketing/` | Marketing site UI kit (homepage, product, pricing, CTA). |
| `slides/` | Slide deck templates in the Automind brand. |

## Content fundamentals

The Figma file gives us only one piece of running copy — the tagline **"Simple · Smart · Reliable"** — plus the wordmark **AUTOMIND**. The rest of the voice has to be inferred from those choices, the visual register (high-energy gradient, confident geometric type), and the brand name.

**Voice & tone**
- **Confident, plain, declarative.** Three short words divided by midline dots. No filler, no qualifiers. Apply the same cadence elsewhere: "Faster. Sharper. Safer." rather than "We help you go a little faster, more sharply, and more safely."
- **Plural-noun lists with separator dots.** When a tagline has 2–4 short benefits, render them with a thin space + `·` + thin space separator, NOT commas. E.g. `Simple · Smart · Reliable`.
- **First-person plural for the brand, second-person for the reader.** "We build…", "You ship…". Avoid "I" and avoid third-person "users".
- **No hedging.** "Will" not "may". "Does" not "is designed to". The brand's promise is reliability — copy must sound reliable.

**Casing**
- The wordmark **AUTOMIND** is set in all-caps in Hando. Treat the brand name as all-caps in display lockups; in running prose it can be sentence-cased ("Automind") so it doesn't shout.
- Headlines: sentence case, OR all-caps when set in Hando at large sizes (matches the wordmark).
- Buttons & nav: sentence case ("Get started", "Learn more"). Never all-caps in body.
- Tagline format: each word capitalised — `Simple · Smart · Reliable`.

**Vibe**
- Tech-forward, trustworthy, premium without being precious. Think automotive performance × productivity software. The "Auto" prefix + the gradient evoke speed, motion, dashboards, telemetry.
- Not playful, not whimsical, no emoji in product UI. Light tasteful use is fine in marketing copy or social, but never substitutes for an icon.
- Comfortable on black. The brand looks more "itself" on a black or deep-navy canvas than on white.

**Examples**
- Hero headline: `Move smarter. Ship faster.`
- Sub-headline: `Automind keeps every system in lockstep — so your team doesn't have to.`
- CTA primary: `Get started`
- CTA secondary: `See it in action`
- Section eyebrow: `BUILT FOR SCALE` (all-caps, Hando, tracked)
- Pricing card name: `Pro` / `Team` / `Enterprise` (single short word)

## Visual foundations

**Colors** — the palette is small, saturated, and mostly cool. Six brand colors plus black/white:

| Token | Hex | Role |
| --- | --- | --- |
| `--brand-pink` | `#FA094E` | Primary accent. The "Auto" in the wordmark. Buttons, links, key affordances. |
| `--brand-pink-deep` | `#F70048` | Accent variant — pressed/hover, gradient stop. |
| `--brand-magenta` | `#940755` | Mid-stop in the brand gradient. |
| `--brand-purple` | `#44055A` | Deep gradient stop, used for moody backgrounds. |
| `--brand-navy` | `#03045E` | Anchor color. Behaves like a dark neutral with personality. |
| `--brand-navy-2` | `#102D74` | Slightly lighter navy used in two-stop pill gradients. |
| `--ink` | `#100F0F` | Near-black for text and surfaces. Not pure black — slightly warm. |
| `--paper` | `#F3F3F0` | Off-white surface — slightly warm. The "white" in the system. |
| `#000` / `#FFF` | | Used for high-contrast surfaces (full-bleed black hero, white text on black). |

The signature move is the **brand gradient**: `linear-gradient(180deg, #F70048 4%, #03045E 88%)` — pink at top, navy at bottom, near-vertical. A four-stop variant adds `#940755` and `#44055A` mid-points and is used on the M-mark itself.

**Backgrounds.** Two registers:
1. **Black canvas** (`#000` or `#100F0F`) with white type — the "hero" mode. Used for top-of-page heroes, key product screenshots, and one-quote slides.
2. **Paper** (`#F3F3F0` or pure white) with ink type — the "content" mode. Used for everything below the fold.

The brand gradient is reserved — used for the logo mark, occasional pill buttons / shapes, and one full-bleed marketing moment per page. It is not a default background.

**Type.**
- **Display:** `Hando` — geometric sans, single-storey `a`, open `c` and `e`. Used for the wordmark, hero headlines, big numbers. Always tight (`line-height: 1`, `letter-spacing: -0.01em`).
- **Body:** `Red Hat Display` — neutral neo-grotesque. Used for body copy, UI labels, captions.
- **No serif.** No mono. Two families only.

Hando is a commercial typeface from Latinotype. We do not have the font files in this kit — substitute with **`Archivo`** from Google Fonts (closest geometric match with single-storey a). If a designer can drop Hando.ttf into `fonts/`, swap the @font-face source.

**Spacing.** 4-pt baseline. Use the scale: `4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96, 128`.

**Corner radii.** Two registers:
- **Soft cards / inputs:** `12px` for cards, `8px` for inputs.
- **Pill / capsule:** `9999px` for primary buttons, hero CTAs, and the brand's signature pill shape (the gradient stripe in the Figma file is a 105 × 697 capsule).

The brand has very little "medium-rounded" surface area. Things are either softly squared (12px) or fully pill.

**Borders & strokes.** Default 1px. The hero "outline" treatment uses a **1.3–2.6px white border on black** (matching the Figma examples). Buttons in dark mode use a 1.3px white border instead of a fill.

**Shadows.** Minimal. The system relies on **color contrast and gradient**, not depth. When a shadow is needed:
- `--shadow-card`: `0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(3,4,94,0.06)` — soft navy-tinted lift.
- `--shadow-pop`: `0 12px 32px rgba(247,0,72,0.18)` — used on the primary CTA on hover.

**Hover & press states.**
- **Buttons (filled gradient):** on hover, brighten 4% (overlay `rgba(255,255,255,0.08)`); on press, darken 4% (overlay `rgba(0,0,0,0.08)`) and scale to `0.985`.
- **Buttons (outline):** on hover, fill background to brand-pink; on press, scale `0.985`.
- **Links / icon buttons:** opacity `0.7` on hover. No underline gymnastics — links use a 1px pink underline on hover.

**Animation.** Restrained. Uses easing `cubic-bezier(0.2, 0.8, 0.2, 1)` (smooth-out) at 180–240 ms for state changes, 320–480 ms for layout transitions. No bounces. No spinning gradients. The one motion flourish is a **directional arrow** — every CTA pairs with a `→` chevron that translates 4px right on hover.

**Imagery.** The Figma file provides one type of imagery: **the logo and the "M" mark** rendered in different treatments (gradient, white outline, black, halftone-line stripes). When real product imagery is needed, the brand vibe asks for **dark, glossy, high-contrast photography** — automotive, server racks, dashboards, neon nightscapes — keyed to the cool magenta/navy palette. No warm sunsets, no people-on-couches, no isometric illustrations.

**Iconography.** See the Iconography section below.

**Layout rules.**
- Generous left/right margins on desktop (≥ 96px).
- Hero headlines hug the left edge of the content column. The right side carries the gradient mark or a screenshot.
- Section eyebrows (small all-caps Hando) sit 16px above headlines.
- Footer: black, white text, M mark + tagline + columns of links.

**Transparency / blur.** Used only for the navbar — `backdrop-filter: blur(12px)` over `rgba(0,0,0,0.6)` when scrolled, on dark pages; `rgba(243,243,240,0.7)` on light pages.

## Iconography

**Approach: thin-stroke monoline icons.** The Figma file ships an icon plate (`assets/iconography-plate.png`, originally `bfc9d68a5479.png`) with 18 generic outline icons — handshake, presenter, browser, warning triangle, target, megaphone, document with checks, calendar with clock, shield with check, star with check, star, group of users, hands holding cross, hand with coin, person meditating, factory, worker with gear, map with pins. Stroke is roughly 2px at icon size, all square endcaps, no fills, slightly rounded corners on rectangles.

Because we don't have the source vectors and the plate is a flat PNG, **production usage should pair with [Lucide Icons](https://lucide.dev) on CDN** — the closest free icon set in style (thin monoline, 24×24, 2px stroke, square caps). Where Lucide doesn't have a perfect match, fall back to the plate as a raster.

**Substitution flag:** Lucide is a substitution. If the Automind brand owner has a vector icon set, drop SVGs into `assets/icons/` and we'll switch over.

**Rules**
- Strictly outline. Never filled.
- Color: inherit `currentColor`. On dark surfaces use `--paper`; on light surfaces use `--ink`. The pink is reserved for emphasis or success.
- Size: 16, 20, 24, 32, 40 px. Default 24.
- Stroke weight: 1.5px at 16/20, 2px at 24/32/40.
- **No emoji.** Not in product, not in marketing.
- **Unicode arrows** (`→`, `↗`, `›`) are part of the system — used in copy for "see more" and as the chevron in CTAs.

## Index of files

- `README.md` — this file.
- `SKILL.md` — agent skill definition.
- `colors_and_type.css` — tokens.
- `fonts/` — webfonts.
- `assets/`
  - `logo-mark-gradient.png` — the M mark, gradient fill (raster).
  - `logo-marks-dark.png` — the M mark, halftone/striped white on dark (raster).
  - `iconography-plate.png` — generic icon set, raster reference.
  - `logo-mark.svg` — the M mark recreated as a vector for product use.
  - `logo-lockup.svg` — wordmark + mark lockup.
- `preview/*.html` — Design System tab cards.
- `ui_kits/marketing/index.html` — marketing site kit.
- `slides/index.html` — slide deck template gallery.
