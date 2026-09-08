// Offline asset pipeline for public/videos/**.
//
// Why this exists: the stage clips come out of a screen recorder, and they did
// not all come out of the same one. Eight are 1920x1080; `checkin-checkout` and
// `inspecao` are 1440x1080 (4:3). Every surface that plays them --
// StageVideoOverlay's cinema, TourStage's takeover -- sizes the film by height,
// so a 4:3 clip landed 25% narrower than the one before it, and the app UI
// inside it 25% smaller. On a totem read from two metres away that is the
// difference between legible and not.
//
// Worse, the two odd clips are not evenly 4:3: they cut between letterboxed
// 16:9 desktop captures (black bands top and bottom, baked into the frame) and
// full-bleed 4:3 zooms. So there is no crop that is lossless -- the bands only
// exist for part of the runtime. CROP below picks, per clip, the 16:9 window
// that swallows every letterbox band and still clears every caption; what it
// gives up is browser chrome at the top of the full-bleed shots. The narration
// captions all sit low in frame, which is why the window is bottom-biased
// rather than centred.
//
// Output is 1920x1080 for every clip, without exception. That uniformity is the
// point: the player can then reserve one 16/9 box and every stage fills it.
//
// CRF 26 / preset slow / no audio reproduces the sizes the committed clips
// already have (pesagem: 1.96MB in, 1.96MB out) -- these were encoded that way,
// there just was not a script saying so. Audio is dropped because the totem has
// no speakers and the players mute on autoplay anyway.
//
//   node scripts/build-videos.mjs
//
// Reads public/videos.orig/** (gitignored, local), writes public/videos/**.
// Requires ffmpeg on PATH.

import { readdir, mkdir, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const run = promisify(execFile);
const SRC = "public/videos.orig";
const OUT = "public/videos";

const W = 1920;
const H = 1080;

// Per-clip crop, in source pixels, applied before the scale to 1920x1080.
// `y` is the top of the window; both sources are 1440 wide, so the window is
// the full width and 810 tall (1440x810 is exactly 16:9).
//
// The numbers come from `ffmpeg -vf cropdetect` sampled a second at a time
// across each clip: they are the top of the tightest letterbox band found, so
// the window starts exactly where the desktop captures start and no band edge
// survives into the output.
const CROP = {
  // Letterbox bands sit at y194..y956. Window 194..1004 covers them whole and
  // still clears the lowest caption ("...quando chegar na etapa configurada",
  // which reaches y990 during the checklist modal).
  inspecao: { w: 1440, h: 810, x: 0, y: 194 },
  // Bands at y174..y902. Window 174..984 clears the totem dialog (y285..y780)
  // and the lowest caption (y950).
  "checkin-checkout": { w: 1440, h: 810, x: 0, y: 174 },
};

const mb = (bytes) => (bytes / 1048576).toFixed(2);

function filters(name) {
  const crop = CROP[name];
  const chain = crop ? [`crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}`] : [];
  // A source already at 1920x1080 with no crop passes through untouched; the
  // scale is a no-op rather than a special case.
  chain.push(`scale=${W}:${H}:flags=lanczos`);
  return chain.join(",");
}

async function build(file) {
  const name = path.basename(file, ".mp4");
  const src = path.join(SRC, file);
  const out = path.join(OUT, file);

  await run("ffmpeg", [
    "-y", "-v", "error",
    "-i", src,
    "-an",
    "-vf", filters(name),
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "26",
    "-pix_fmt", "yuv420p",
    // The clips are fetched over HTTP by the page, so the moov atom has to be
    // up front or the first play waits for the whole file.
    "-movflags", "+faststart",
    out,
  ]);

  const before = (await stat(src)).size;
  const after = (await stat(out)).size;
  console.log(
    `  ${file.padEnd(28)} ${mb(before).padStart(7)}MB -> ${mb(after).padStart(7)}MB` +
      (CROP[name] ? "  (recortado para 16:9)" : "")
  );
  return { before, after };
}

await mkdir(OUT, { recursive: true });
const all = (await readdir(SRC)).filter((f) => f.endsWith(".mp4")).sort();

console.log(`Processing ${all.length} clips from ${SRC}/ -> ${OUT}/ at ${W}x${H}\n`);
let before = 0;
let after = 0;
for (const file of all) {
  const r = await build(file);
  before += r.before;
  after += r.after;
}
console.log(`\nTotal ${mb(before)}MB -> ${mb(after)}MB (${((100 * after) / before).toFixed(0)}%)`);
