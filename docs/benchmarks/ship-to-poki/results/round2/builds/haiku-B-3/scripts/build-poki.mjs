// Builds dist/ with only what the Poki upload needs: index.html, style.css, src/, and assets/
// referenced by the game. Dev tooling, docs, .claude/, and the asset manifest stay out.
// Usage: node scripts/build-poki.mjs
import { cp, mkdir, readFile, rm, stat, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist");

// Every asset path the game code loads. Keep in sync with src/*.js.
const REQUIRED_ASSETS = ["assets/music.wav", "assets/jump.wav", "assets/gem.wav"];

const missing = [];
for (const a of REQUIRED_ASSETS) {
  try { await stat(join(root, a)); } catch { missing.push(a); }
}
if (missing.length) {
  console.error(`Build stopped. Missing assets: ${missing.join(", ")}`);
  process.exit(1);
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(root, "index.html"), join(out, "index.html"));
await cp(join(root, "style.css"), join(out, "style.css"));
await cp(join(root, "src"), join(out, "src"), { recursive: true });
await cp(join(root, "assets"), join(out, "assets"), {
  recursive: true,
  filter: (src) => !src.endsWith("manifest.json"),
});

let bytes = 0;
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else bytes += (await stat(p)).size;
  }
}
await walk(out);
console.log(`dist/ built: ${(bytes / 1024).toFixed(1)} KB total`);
