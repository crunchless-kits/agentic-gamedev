#!/usr/bin/env node
// TypeScript project health facts for web-game-audit. Read-only. Prints JSON.
// Usage: node ts_health.mjs [project-root] [--tsc] [--build-dir dist]
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const root = resolve(args.find((a) => !a.startsWith("--")) ?? ".");
const runTsc = args.includes("--tsc");
const buildDir = args.includes("--build-dir") ? args[args.indexOf("--build-dir") + 1] : "dist";
const SKIP = new Set(["node_modules", "dist", "build", "out", ".git", ".cache", "coverage"]);

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

const pkg = readJson(join(root, "package.json")) ?? {};
const tsconfig = readJson(join(root, "tsconfig.json")) ?? {};
const co = tsconfig.compilerOptions ?? {};
const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
const frameworks = ["phaser", "pixi.js", "three", "@babylonjs/core", "excalibur", "kaplay", "matter-js", "colyseus", "socket.io", "vite", "esbuild", "rollup", "webpack", "parcel", "typescript", "playwright", "@playwright/test", "vitest", "jest"];
const found = Object.fromEntries(frameworks.filter((f) => deps[f]).map((f) => [f, deps[f]]));

const files = existsSync(root) ? walk(root) : [];
const hasPackage = existsSync(join(root, "package.json"));
const ts = files.filter((f) => [".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(extname(f)) && !/\.min\.js$/.test(f));
const plainJs = !hasPackage && ts.length > 0 && !ts.some((f) => /\.tsx?$/.test(f));
const counts = { files: ts.length, lines: 0, any: 0, tsIgnore: 0, tsExpectError: 0, asUnknownAs: 0, nonNullAssert: 0, mathRandom: 0, rafDirect: 0 };
for (const f of ts) {
  const s = readFileSync(f, "utf8");
  counts.lines += s.split("\n").length;
  counts.any += (s.match(/\bany\b/g) ?? []).length;
  counts.tsIgnore += (s.match(/@ts-ignore/g) ?? []).length;
  counts.tsExpectError += (s.match(/@ts-expect-error/g) ?? []).length;
  counts.asUnknownAs += (s.match(/as unknown as/g) ?? []).length;
  counts.nonNullAssert += (s.match(/\w!\./g) ?? []).length;
  counts.mathRandom += (s.match(/Math\.random\(/g) ?? []).length;
  counts.rafDirect += (s.match(/requestAnimationFrame\(/g) ?? []).length;
}

const providers = ["PokiSDK", "CrazyGames", "gdsdk", "GD_OPTIONS", "ytgame", "mraid", "FbPlayableAd", "gtag(", "analytics", "localStorage"];
const leaks = {};
for (const f of ts) {
  const s = readFileSync(f, "utf8");
  for (const p of providers) if (s.includes(p)) (leaks[p] ??= []).push(f.replace(root + "/", ""));
}

let tsc = null;
if (runTsc) {
  try { execSync("npx --no-install tsc --noEmit", { cwd: root, stdio: "pipe", timeout: 180000 }); tsc = { ok: true, errors: 0 }; }
  catch (e) { const out = String(e.stdout ?? "") + String(e.stderr ?? ""); tsc = { ok: false, errors: (out.match(/error TS\d+/g) ?? []).length, sample: out.split("\n").slice(0, 10) }; }
}

let build = null;
const bd = join(root, buildDir);
if (existsSync(bd)) {
  const bf = walk(bd); const byExt = {}; let total = 0;
  for (const f of bf) { const sz = statSync(f).size; total += sz; const ext = extname(f) || "(none)"; byExt[ext] = (byExt[ext] ?? 0) + sz; }
  build = { dir: buildDir, files: bf.length, totalBytes: total, byExt, largest: bf.map((f) => [f.replace(root + "/", ""), statSync(f).size]).sort((a, b) => b[1] - a[1]).slice(0, 10) };
}

if (plainJs) console.error("note: plain JavaScript project (no package.json, no TypeScript); strictness and tsc checks do not apply, counts cover .js files");
console.log(JSON.stringify({
  root, node: process.version, plainJavaScript: plainJs,
  package: { name: pkg.name, scripts: Object.keys(pkg.scripts ?? {}), lockfile: ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb"].find((l) => existsSync(join(root, l))) ?? null, type: pkg.type ?? "commonjs" },
  frameworks: found,
  tsconfig: { strict: co.strict ?? false, noImplicitAny: co.noImplicitAny ?? null, strictNullChecks: co.strictNullChecks ?? null, noUncheckedIndexedAccess: co.noUncheckedIndexedAccess ?? null, target: co.target ?? null, module: co.module ?? null, paths: Object.keys(co.paths ?? {}).length },
  counts, providerReferences: leaks, tsc, build,
}, null, 2));
