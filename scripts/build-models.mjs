// Offline asset pipeline for public/models/**.
//
// Why this exists: the yard's .glb files come straight out of Sketchfab and a
// plant editor, and they are shaped for an editor, not a renderer. `grade` is
// 285 separate 24-vertex pickets; `parque-tanques` is 1,514 primitives over 24
// materials. Every one of those nodes becomes its own three.js Mesh and its own
// draw call, so the scene was spending ~9,000 draw calls to show ~176 materials.
//
// `join` (which runs `dedup` and `flatten` first) merges primitives that share a
// material, which is the whole fix. `flatten` also bakes each node's transform
// into its geometry — that is what later lets the same meshes be instanced, and
// it is also the step that could move an asset, so scripts/check-bounds.mjs
// gates every model on its bounding box not drifting.
//
// Compression is meshopt, not Draco: drei turns the meshopt decoder on by
// default and three-stdlib embeds its wasm inline, while Draco's default
// decoder path is a gstatic CDN — a network dependency a totem cannot take.
//
//   node scripts/build-models.mjs [--check]
//
// Reads public/models.orig/**, writes public/models/**.

import { readdir, mkdir, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const run = promisify(execFile);
const SRC = "public/models.orig";
const OUT = "public/models";

// Per-model treatment. Everything not listed gets STRUCTURE: these are already
// small in triangles and only need their node explosion collapsed.
const HEAVY = {
  // 135k triangles x 21 instances was 78% of the scene's geometry. The leaf
  // cards are 2-triangle quads that cannot decimate, so the simplifier spends
  // its budget on the 73k-triangle bark tube, which is exactly right.
  "plants/bush-realista": { simplify: 0.12, error: 0.02, resize: 512 },
  "plants/arvore-grande": { simplify: 0.35, error: 0.01, resize: 512 },
  // Not simplified: the tour flies right up to it. Its cost is 11 x 1024px
  // textures (~61 MB of VRAM), not its 48k triangles.
  "trucks/fuel-truck-style-adapted": { resize: 512 },
};

const gltf = (...args) =>
  run("npx", ["--yes", "@gltf-transform/cli@4.5.0", ...args], {
    shell: true,
    maxBuffer: 32 * 1024 * 1024,
  });

async function* glbs(dir, base = "") {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) yield* glbs(path.join(dir, entry.name), rel);
    else if (entry.name.endsWith(".glb")) yield rel;
  }
}

const mb = (bytes) => (bytes / 1048576).toFixed(2);

async function build(rel) {
  const slug = path.dirname(rel).replace(/\\/g, "/");
  const src = path.join(SRC, rel);
  const out = path.join(OUT, rel);
  await mkdir(path.dirname(out), { recursive: true });

  const heavy = HEAVY[slug] ?? {};
  const tmp = (n) => path.join(path.dirname(out), `.t${n}.glb`);
  const steps = [];

  // prune drops attributes nothing samples — the bush ships TEXCOORD_2 and
  // TEXCOORD_3 that no material references, at 16 bytes per vertex.
  steps.push(["prune", src, tmp(1), "--keep-attributes", "false"]);
  steps.push(["join", tmp(1), tmp(2)]);
  steps.push(["weld", tmp(2), tmp(3)]);
  let last = tmp(3);

  if (heavy.simplify) {
    steps.push(["simplify", last, tmp(4), "--ratio", String(heavy.simplify), "--error", String(heavy.error)]);
    last = tmp(4);
  }
  if (heavy.resize) {
    steps.push(["resize", last, tmp(5), "--width", String(heavy.resize), "--height", String(heavy.resize)]);
    last = tmp(5);
    // Normal maps band badly under lossy chroma subsampling; leave them alone.
    steps.push(["webp", last, tmp(6), "--quality", "88", "--slots", "!normalTexture"]);
    last = tmp(6);
  }
  steps.push(["meshopt", last, out, "--level", "high"]);

  for (const step of steps) {
    try {
      await gltf(...step);
    } catch (err) {
      throw new Error(`${rel} failed at \`${step[0]}\`: ${err.stderr || err.message}`);
    }
  }

  const before = (await stat(src)).size;
  const after = (await stat(out)).size;
  console.log(
    `  ${rel.padEnd(48)} ${mb(before).padStart(8)}MB -> ${mb(after).padStart(8)}MB` +
      `  (${((100 * after) / before).toFixed(0)}%)`
  );
  return { before, after };
}

const all = [];
for await (const rel of glbs(SRC)) all.push(rel);
all.sort();

console.log(`Processing ${all.length} models from ${SRC}/ -> ${OUT}/\n`);
let before = 0;
let after = 0;
for (const rel of all) {
  const r = await build(rel);
  before += r.before;
  after += r.after;
}
console.log(`\nTotal ${mb(before)}MB -> ${mb(after)}MB (${((100 * after) / before).toFixed(0)}%)`);
