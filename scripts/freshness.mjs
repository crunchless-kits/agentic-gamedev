#!/usr/bin/env node
// Writes the "Coverage and freshness" block in README.md (between markers) and FRESHNESS.md:
// kit version, what each engine and platform member is written against, and the Last verified date of every snapshot.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const KIT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(KIT, "package.json"), "utf8"));
const market = JSON.parse(readFileSync(join(KIT, ".claude-plugin", "marketplace.json"), "utf8"));
const rows = [];
for (const p of market.plugins) {
  const dir = join(KIT, "plugins", p.name, "skills");
  if (!existsSync(dir)) continue;
  for (const s of readdirSync(dir)) {
    const rd = join(dir, s, "references");
    if (!existsSync(rd)) continue;
    for (const f of readdirSync(rd)) {
      const t = readFileSync(join(rd, f), "utf8");
      const m = t.match(/Last verified:\s*(\d{4}-\d{2}-\d{2})/);
      if (m) rows.push({ area: f.replace(/-(sdk-)?notes\.md$|\.md$/, "").replace(/-/g, " "), member: s, verified: m[1] });
    }
  }
}
rows.sort((a, b) => a.area.localeCompare(b.area));
const written = [
  ["Unity","Unity 6.3 LTS (6000.3.28f1) and Unity 6.6, with the Unity CLI 1.0 and its MCP server; APIs verified against the installed editor per run"],
  ["TypeScript web","Vite and TypeScript with Phaser, PixiJS, Three.js, or Canvas, wrapped with Capacitor for Android and iOS; type definitions are the source of truth"],
  ["Roblox","Roblox Studio and Luau (rolling releases), Rojo and Wally toolchain; APIs verified against the Creator Hub docs per run"],
  ["Unreal","Unreal Engine 5.8.4, C++ and Blueprints"],
  ["Godot","Godot 4.7.2, GDScript and C#"],
  ["Cocos Creator","Cocos Creator 3.8.8, TypeScript"],
  ["Claude Code","2.1.319 measured: context: fork, agent: (namespaced cl-core:cl-builder in plugins), and model: honored; paths: honored for vendored .claude/skills only"],
];
const lines = [
  `Kit v${pkg.version}. Every release carries notes in CHANGELOG.md and on the GitHub Releases page. Snapshots older than 90 days are re-verified before any member writes code against them; a monthly job opens a pull request when a source changes.`,
  "",
  "| Engine or platform | Written against |", "| --- | --- |",
  ...written.map(([a, b]) => `| ${a} | ${b} |`),
  "",
  "| Platform snapshot | Member | Last verified |", "| --- | --- | --- |",
  ...rows.map((r) => `| ${r.area} | ${r.member} | ${r.verified} |`),
];
const block = lines.join("\n");
const readmePath = join(KIT, "README.md");
const readme = readFileSync(readmePath, "utf8");
const START = "<!-- freshness:start -->", END = "<!-- freshness:end -->";
const s = readme.indexOf(START), e = readme.indexOf(END);
const hasMarkers = s !== -1 && e !== -1;
const next = hasMarkers ? `${readme.slice(0, s + START.length)}\n${block}\n${readme.slice(e)}` : readme;
if (process.argv.includes("--check")) { if (next !== readme) { console.error("Freshness block is stale; run node scripts/freshness.mjs"); process.exit(1); } console.log("freshness block current"); process.exit(0); }
if (hasMarkers) writeFileSync(readmePath, next);
writeFileSync(join(KIT, "FRESHNESS.md"), `# Coverage and freshness\n\n${block}\n`);
console.log(`Freshness written (${hasMarkers ? "README block and" : ""} FRESHNESS.md): ${rows.length} snapshots`);
