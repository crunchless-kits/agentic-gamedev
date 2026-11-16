#!/usr/bin/env node
// Crunchless engine detection, shared by /cl-start, /cl-audit, and doctor.mjs. Read-only. Prints JSON.
// Usage: node detect-engine.mjs [project-root]
// Output: { engine, evidence, audit, all: [{ engine, evidence }] }. engine is "none" for an idea-stage folder;
// when "all" holds more than one engine, ask the user which one to work on.
// Engine-specific signals run before the generic web rule, because Cocos Creator projects also have a package.json.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AUDIT = {
  unity: "unity-project-audit",
  godot: "godot-project-audit",
  roblox: "roblox-project-audit",
  unreal: "unreal-project-audit",
  cocos: "cocos-project-audit",
  web: "web-game-audit",
};

const readJson = (path) => { try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; } };
const listRoot = (root) => { try { return readdirSync(root); } catch { return []; } };

export function detectEngines(rootArg = ".") {
  const root = resolve(rootArg);
  const files = listRoot(root);
  const ext = (e) => files.find((f) => f.toLowerCase().endsWith(e));
  const found = [];
  const hit = (engine, evidence) => { if (evidence && !found.some((f) => f.engine === engine)) found.push({ engine, evidence }); };

  if (existsSync(join(root, "ProjectSettings", "ProjectVersion.txt"))) hit("unity", "ProjectSettings/ProjectVersion.txt");
  if (files.includes("project.godot")) hit("godot", "project.godot");
  // Roblox: a Rojo project file (default.project.json or any *.project.json with a "tree"), or a place file.
  const rojo = files.filter((f) => f.endsWith(".project.json")).find((f) => readJson(join(root, f))?.tree);
  hit("roblox", rojo ?? ext(".rbxlx") ?? ext(".rbxl"));
  hit("unreal", ext(".uproject"));
  const pkg = files.includes("package.json") ? readJson(join(root, "package.json")) : null;
  if (pkg && Object.hasOwn(pkg, "creator")) hit("cocos", "package.json (creator key)");
  if (!found.some((f) => f.engine === "cocos")) {
    if (pkg || files.includes("package.json")) hit("web", "package.json");
    else if (files.includes("tsconfig.json")) hit("web", "tsconfig.json");
    else if (files.includes("index.html")) hit("web", "index.html (plain JavaScript, no package.json: skip tsc and lockfile checks)");
  }
  return found;
}

export function detectEngine(rootArg = ".") {
  const all = detectEngines(rootArg);
  const first = all[0];
  return {
    engine: first?.engine ?? "none",
    evidence: first?.evidence ?? null,
    audit: first ? AUDIT[first.engine] : null,
    all,
    note: all.length > 1 ? "more than one engine found; ask which to work on" : all.length ? "ok" : "no engine files; idea stage",
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(detectEngine(process.argv[2] ?? "."), null, 2));
}
