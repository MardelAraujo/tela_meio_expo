# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev     # dev server on :3000
npm run build   # production build (also the only type-check — tsc has noEmit and no script)
npm run lint    # eslint (flat config, next core-web-vitals + typescript)
npm run assets  # legacy 3D model pipeline (public/models.orig/ -> public/models/); unused by the map
```

No test suite exists.

## What this is

A single-page kiosk/totem display (pt-BR) for AutoMind's "Autoload" terminal product: an interactive map of a fuel/cargo terminal where each operational stage is a clickable pin that opens a description and a demo video. There is no backend, no routing beyond `/`, and no data fetching — everything is static config plus assets in `public/`.

## Architecture

Single state atom: `activeStage: Stage | null` lives in `components/StageView.tsx` and drives both halves of the split screen — `PlantMap` (the map, top) and `StagePanel` (text/video, bottom). Selecting `null` returns to overview.

**The map is one drawing, not a scene.** `public/map/terminal.webp` is an isometric line illustration of the terminal (1662×946, ~168KB); the untouched source PNG lives in `public/models.orig/` (gitignored, local). `components/PlantMap.tsx` puts it on a layer inside a clipping viewport and moves the camera by writing a single `translate3d(...) scale(...)` onto that layer. It replaced a real three.js scene — ~40 glTF models, a procedural `<Environment>`, OrbitControls, roughly 30MB before first paint. If you need the old renderer, it is in git history at commit `1106086` (`lib/plant-elements.ts`, `lib/canvas-textures.ts`, `components/Hotspot3D.tsx`, `config/plant-layout.json` and `public/models/*.glb`).

**Stage coordinates are the artwork's own pixels.** `x`/`y` in `config/stages.ts` are read straight off `terminal.webp` (origin top-left, `MAP_W`×`MAP_H`), and `zoom.scale` is a magnification over the overview. `PlantMap` normalizes them for the pins and multiplies them by the measured fit for the camera. Swapping the illustration means re-reading every coordinate against the new drawing — nothing else derives them.

**The camera is imperative on purpose.** `apply()` writes `layer.style.transform` directly instead of going through state: a pan is one style assignment per `pointermove`, not a React render of the map and every pin. Pins live *inside* the transformed layer so they travel with the drawing for free, and counter-scale by `--map-inv` — a registered custom property (`@property` in `globals.css`), so it can be transitioned alongside the transform instead of snapping. `settle()` keeps the drawing over the viewport; without it, framing a corner stage showed half a pane of empty paper.

**One derived pass runs at module load in `config/stages.ts`** and mutates the exported `stages` array: `cleanCopy` mojibake repair on titles/descriptions. New stages get it automatically. The `places` grouping above it survives from the 3D map, where five stages stood within 70m of the gatehouse; on this artwork every step has a building of its own, so no place currently holds more than one. Keep it — it is what a future drawing would need to put two steps in one building.

**Layer stages have no pin.** `auditoria` and `gestao` are readings across the whole operation rather than spots in it (`layer: true`); they are anchored to the dashboards in the drawing for reference, but selecting one holds the map at the overview and lets the panel do the talking.

## Conventions

- Target is a touch totem (portrait 1080×1920) as well as desktop. The map pane is wider than the drawing on desktop and taller than it on the totem, so the overview letterboxes; the pane is painted `--map-paper` (sampled off the drawing) so the leftover field reads as the illustration's own paper. Interactive elements handle `onPointerDown` with a `pointerType === "touch"` guard *in addition to* `onClick` (see `StagePanel`, `YardPin`) — on touch the map's own drag gesture would otherwise swallow the tap.
- All UI copy is Portuguese. All styling is plain CSS in `app/globals.css` (CSS custom properties in `:root`); no Tailwind, no CSS modules.
- Non-obvious geometry/camera decisions are documented in comments explaining *why* the constant has that value. Preserve them when refactoring.
