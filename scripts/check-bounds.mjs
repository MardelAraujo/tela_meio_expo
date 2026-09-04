// Gate for the asset pipeline: did any model move?
//
// `join` runs `flatten` first, which bakes each node's transform into its
// geometry. That is what makes the meshes instanceable, and it is also the one
// step that can silently displace an asset — fuel-truck's root node carries a
// -90 degree X rotation and a 0.011 scale, so a mis-baked flatten puts four
// trucks on their sides in the middle of the yard.
//
// CLAUDE.md's contract is that every element keeps the exact p/r/s the plant
// editor saved. This compares each model's scene bounding box before and after,
// relative to the model's own size, so the check is scale-independent.
//
//   node scripts/check-bounds.mjs
//
// Exits non-zero if anything drifted past tolerance.

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import { getBounds } from "@gltf-transform/functions";
import { readdir } from "node:fs/promises";
import path from "node:path";

const SRC = "public/models.orig";
const OUT = "public/models";

// Lossless w.r.t. vertex positions: prune, join, weld, meshopt. Only floating
// point noise from the flatten matrix multiply should show up here.
const TOL_LOSSLESS = 1e-4;
// simplify moves vertices by design; its own --error bound is the budget.
const TOL_SIMPLIFIED = 3e-2;
const SIMPLIFIED = new Set(["plants/bush-realista", "plants/arvore-grande"]);

// The output is meshopt-compressed, so the reader needs the extension and its
// decoder or it refuses the file outright.
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });

// Scene-space, not mesh-local: `flatten` deliberately rewrites local POSITION
// values, so comparing raw accessor min/max would flag every model. What has to
// hold constant is where the geometry ends up once node transforms are applied,
// which is exactly what getBounds() walks.
function bounds(doc) {
  return getBounds(doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0]);
}

async function* glbs(dir, base = "") {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) yield* glbs(path.join(dir, entry.name), rel);
    else if (entry.name.endsWith(".glb")) yield rel;
  }
}

let failed = 0;
const rows = [];
for await (const rel of glbs(SRC)) {
  const slug = path.dirname(rel).replace(/\\/g, "/");
  const a = bounds(await io.read(path.join(SRC, rel)));
  const b = bounds(await io.read(path.join(OUT, rel)));

  const extent = Math.max(...a.max.map((v, i) => v - a.min[i]));
  const drift = Math.max(
    ...a.min.map((v, i) => Math.abs(v - b.min[i])),
    ...a.max.map((v, i) => Math.abs(v - b.max[i]))
  );
  const rel_ = drift / extent;
  const tol = SIMPLIFIED.has(slug) ? TOL_SIMPLIFIED : TOL_LOSSLESS;
  const ok = rel_ <= tol;
  if (!ok) failed++;
  rows.push(`${ok ? "ok  " : "DRIFT"} ${slug.padEnd(40)} rel=${rel_.toExponential(2)} tol=${tol}`);
}

console.log(rows.sort().join("\n"));
console.log(failed ? `\n${failed} model(s) drifted.` : `\nAll models within tolerance.`);
process.exit(failed ? 1 : 0);
