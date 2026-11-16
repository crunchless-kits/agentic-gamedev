#!/usr/bin/env node
// Kit smoke test. Exit 1 on any failure. Runs in the source repo and inside every exported edition.
//   registry --check; install into a temp project, re-run, conflict, force, no cross-plugin dependency;
//   engine detection with one fixture per engine; every scripts/ or references/ path a member names resolves in a
//   cache-style copy (each plugin folder alone) and in a vendored install; no exported file carries a placeholder.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, appendFileSync, rmSync, cpSync, statSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INSTALL = join(KIT, "scripts", "install.mjs");
const fails = [];
const check = (cond, msg) => { if (!cond) fails.push(msg); console.log(`${cond ? "ok  " : "FAIL"} ${msg}`); };
const run = (args, cwd = KIT) => execFileSync("node", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const posix = (p) => p.split(sep).join("/");
const walk = (dir, skip = () => false) => {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (skip(p, e)) continue;
    if (e.isDirectory()) out.push(...walk(p, skip)); else out.push(p);
  }
  return out;
};
const temps = [];
const tmp = (tag) => { const d = mkdtempSync(join(tmpdir(), `crunchless-${tag}-`)); temps.push(d); return d; };

try { run([join(KIT, "scripts", "registry.mjs"), "--check"]); check(true, "registry --check passes"); } catch (e) { check(false, `registry --check: ${String(e.stderr || e.stdout || e.message).trim().split("\n")[0]}`); }

const market = JSON.parse(readFileSync(join(KIT, ".claude-plugin", "marketplace.json"), "utf8"));
const plugins = market.plugins.map((p) => ({ name: p.name, dir: resolve(KIT, p.source), description: p.description ?? "" }));
const pluginNames = plugins.map((p) => p.name);
const hasRelease = pluginNames.includes("cl-release");
const bundles = JSON.parse(readFileSync(join(KIT, "bundles.json"), "utf8"));
const firstBundle = Object.keys(bundles).find((k) => bundles[k] && bundles[k].length);

// ---- Install flow ----------------------------------------------------------------------------
const dir = tmp("smoke");
try {
  writeFileSync(join(dir, "CLAUDE.md"), "# Demo\n");
  const sel = hasRelease ? "release" : "core";
  let out = run([INSTALL, "--project", dir, "--plugins", sel]);
  if (sel !== "core") check(/Including cl-core/.test(out), `${sel} auto-includes core`);
  if (hasRelease) check(!/Including cl-web/.test(out) && !existsSync(join(dir, ".claude", "skills", "web-game-audit")), "release no longer pulls in cl-web");
  check(existsSync(join(dir, ".claude", "crunchless", "cl-core", "scripts", "doctor.mjs")) && existsSync(join(dir, ".claude", "crunchless", "cl-core", "kit-index.json")), "plugin scripts and kit-index.json vendored under .claude/crunchless/cl-core/");
  check(!walk(join(dir, ".claude", "skills")).some((f) => f.split(sep).includes("evals")), "evals not vendored");
  const manifest = JSON.parse(readFileSync(join(dir, ".claude", "crunchless.manifest.json"), "utf8"));
  const installed = Number(out.match(/installed\s+(\d+)/)[1]);
  check(Object.keys(manifest.files).length === installed, `manifest tracks every installed file (${installed})`);
  out = run([INSTALL, "--project", dir, "--plugins", sel]);
  check(Number(out.match(/unchanged\s+(\d+)/)[1]) === installed && /CLAUDE\.md: up to date/.test(out), "second run changes nothing");
  appendFileSync(join(dir, ".claude", "skills", "cl-router", "SKILL.md"), "\nlocal edit\n");
  out = run([INSTALL, "--project", dir, "--plugins", sel]);
  check(Number(out.match(/conflicts\s+(\d+)/)[1]) === 1, "edited file reported as conflict");
  out = run([INSTALL, "--project", dir, "--plugins", sel, "--force"]);
  check(Number(out.match(/overwritten\s+(\d+)/)[1]) === 1, "--force overwrites the edited file");
  out = run([INSTALL, "--project", dir, "--plugins", sel, "--no-deps", "--dry-run"]);
  check(!/Including cl-/.test(out), "--no-deps skips dependencies");
  const block = readFileSync(join(dir, "CLAUDE.md"), "utf8");
  check(block.includes("<!-- crunchless:start -->") && !block.includes("{{commands}}"), "CLAUDE.md block present with its commands line filled");
  const blockCmds = [...block.matchAll(/`\/([a-z0-9-]+)/g)].map((m) => m[1]);
  check(blockCmds.length > 0 && blockCmds.every((c) => existsSync(join(dir, ".claude", "commands", `${c}.md`))), "CLAUDE.md block names only installed commands");
  out = run([INSTALL, "--project", dir, "--bundle", firstBundle]);
  const settings = JSON.parse(readFileSync(join(dir, ".claude", "settings.json"), "utf8"));
  check(existsSync(join(dir, ".claude", "hooks", "guard-bash.mjs")) && JSON.stringify(settings).includes("guard-bash.mjs"), `guard hook vendored and registered with the ${firstBundle} bundle`);
  check(settings.hooks.PreToolUse.filter((h) => JSON.stringify(h).includes("guard-bash.mjs")).length === 1, "guard hook registered exactly once");
  out = run([INSTALL, "--project", dir, "--bundle", firstBundle]);
  check(/Guard hook: already registered/.test(out), "guard hook registration is idempotent");
  execFileSync("git", ["init", "-q"], { cwd: dir });
  out = run([INSTALL, "--project", dir, "--bundle", firstBundle, "--local-only"]);
  check(readFileSync(join(dir, ".git", "info", "exclude"), "utf8").includes(".claude/") && /Agent files stay out of git/.test(out), "--local-only excludes agent files from git and says so");
  for (const name of Object.keys(bundles)) {
    try { run([INSTALL, "--project", dir, "--bundle", name, "--dry-run"]); } catch (e) { check(false, `bundle "${name}" fails to install: ${String(e.stderr || e.message).trim().split("\n")[0]}`); }
  }
  check(true, `every bundle name installs in this edition (${Object.keys(bundles).length})`);
} catch (e) {
  check(false, `install flow threw: ${String(e.stderr || e.stdout || e.message).trim().split("\n").slice(-3).join(" | ")}`);
}

// ---- Edition warnings ------------------------------------------------------------------------
const upgradePath = join(KIT, "upgrade-members.json");
const edition = existsSync(upgradePath) ? JSON.parse(readFileSync(upgradePath, "utf8")) : null;
if (edition && Object.keys(edition.missingPlugins ?? {}).length) {
  const missing = Object.keys(edition.missingPlugins)[0];
  const r = spawnSync(process.execPath, [INSTALL, "--project", tmp("edition"), "--plugins", missing, "--dry-run"], { encoding: "utf8" });
  check(r.status === 0 && /not in this edition/.test(`${r.stderr}${r.stdout}`), `install warns, without failing, that ${missing} is not in this edition`);
}

// ---- Engine detection ------------------------------------------------------------------------
const detect = join(KIT, "plugins", "cl-core", "scripts", "detect-engine.mjs");
if (existsSync(detect)) {
  const fixtures = {
    unity: { "ProjectSettings/ProjectVersion.txt": "m_EditorVersion: 6000.0.0f1\n" },
    godot: { "project.godot": "config_version=5\n" },
    roblox: { "default.project.json": JSON.stringify({ name: "game", tree: { $className: "DataModel" } }) },
    "roblox-place": { "game.rbxlx": "<roblox/>" },
    unreal: { "Game.uproject": "{}" },
    cocos: { "package.json": JSON.stringify({ name: "game", creator: { version: "3.8.6" } }), "settings/.keep": "" },
    web: { "package.json": JSON.stringify({ name: "game", devDependencies: { typescript: "5" } }) },
    "web-plain": { "index.html": "<!doctype html>", "main.js": "" },
    none: {},
  };
  for (const [name, files] of Object.entries(fixtures)) {
    const d = tmp(`engine-${name}`);
    for (const [rel, text] of Object.entries(files)) { mkdirSync(dirname(join(d, rel)), { recursive: true }); writeFileSync(join(d, rel), text); }
    const want = name.replace(/-(place|plain)$/, "");
    const got = JSON.parse(run([detect, d])).engine;
    check(got === want, `detect-engine: ${name} fixture reads as ${got}`);
  }
  const doctor = JSON.parse(run([join(KIT, "plugins", "cl-core", "scripts", "doctor.mjs"), dir]));
  check(doctor.engineDetected?.engine !== undefined && typeof doctor.descriptionLoad?.budgetCharacters === "number", "doctor uses the shared detector and reports the description budget");
}

// ---- Path resolution: cache-style copy and vendored install -----------------------------------
// A mention is a backticked or bare path under scripts/ or references/, a ../../ path, or a ${CLAUDE_PLUGIN_ROOT} path.
// A kit-root plugins/cl-*/ path is caught too: it is always broken once installed.
const MENTION = /(?<![\w./-])plugins\/cl-[\w./-]+\.[a-z]{1,5}\b|\$\{CLAUDE_PLUGIN_ROOT\}\/[\w./-]*[\w-]|(?<![\w./-])(?:\.\.\/)+[\w./-]*[\w-]|(?<![\w./${}-])(?:\.claude\/[\w./-]*?)?(?:scripts|references)\/[\w./-]+\.[a-z]{1,5}\b/g;
const isMember = (rel) => /^(agents|commands|skills)\//.test(rel) && !rel.split("/").includes("evals");
const kitPluginFiles = new Set(plugins.flatMap((p) => walk(p.dir).map((f) => posix(relative(p.dir, f)))));
const kitScripts = new Set(walk(join(KIT, "scripts")).map((f) => `scripts/${posix(relative(join(KIT, "scripts"), f))}`));
const allSkills = new Map(); // skill name -> plugin
for (const p of plugins) for (const d of existsSync(join(p.dir, "skills")) ? readdirSync(join(p.dir, "skills")) : []) allSkills.set(d, p.name);

// A bare scripts/ or references/ mention counts only when the kit ships a file at that tail: anything else is a path
// in the user's project (such as scripts/build.sh), and a kit-root script is run from a clone of the kit.
const kitOwned = (m) => [...kitPluginFiles].some((f) => f === m || f.endsWith(`/${m}`));
function mentionsIn(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) for (const m of line.matchAll(MENTION)) out.push({ m: m[0].replace(/[.,;:]+$/, ""), line });
  return out;
}
function resolveMention({ m, line }, file, ctx) {
  const tries = [];
  if (m.startsWith("${CLAUDE_PLUGIN_ROOT}/")) tries.push(join(ctx.pluginRoot, m.slice("${CLAUDE_PLUGIN_ROOT}/".length)));
  else if (m.startsWith("../")) tries.push(resolve(dirname(file), m));
  else if (m.startsWith(".claude/")) tries.push(join(ctx.projectRoot ?? "\0", m));
  else if (m.startsWith("plugins/")) return false; // a cached or vendored plugin has no kit root
  else {
    if (!kitOwned(m)) return true;
    if (ctx.skillDir) tries.push(join(ctx.skillDir, m));
    tries.push(join(ctx.pluginRoot, m));
    for (const [name, plugin] of allSkills) if (line.includes(name)) tries.push(join(ctx.skillHome(name, plugin), m));
  }
  return tries.some((t) => existsSync(t));
}

// Cache-style: each plugin folder copied alone, as Claude Code's plugin cache does; nothing from the kit root.
const cache = tmp("cache");
for (const p of plugins) cpSync(p.dir, join(cache, p.name), { recursive: true });
const broken = { cache: [], vendored: [] };
for (const p of plugins) {
  const root = join(cache, p.name);
  for (const f of walk(root)) {
    const rel = posix(relative(root, f));
    if (!f.endsWith(".md") || !isMember(rel)) continue;
    const skillDir = rel.startsWith("skills/") ? join(root, "skills", rel.split("/")[1]) : null;
    for (const mention of mentionsIn(readFileSync(f, "utf8"))) {
      if (mention.m.startsWith("../") && !rel.startsWith("skills/")) continue; // agents and commands are not read from a folder
      if (!resolveMention(mention, f, { pluginRoot: root, skillDir, skillHome: (n, pl) => join(cache, pl, "skills", n) })) broken.cache.push(`${p.name}/${rel}: ${mention.m}`);
    }
  }
}
check(!broken.cache.length, `member paths resolve in a cache-style copy${broken.cache.length ? `: ${broken.cache.slice(0, 8).join("; ")}${broken.cache.length > 8 ? ` (+${broken.cache.length - 8})` : ""}` : ""}`);

// Vendored: install everything, then resolve against .claude/.
const vend = tmp("vendored");
try {
  run([INSTALL, "--project", vend, "--no-hooks"]);
  const claude = join(vend, ".claude");
  const vmanifest = JSON.parse(readFileSync(join(claude, "crunchless.manifest.json"), "utf8"));
  let leftovers = 0;
  for (const [rel0, entry] of Object.entries(vmanifest.files)) {
    const rel = posix(rel0);
    if (!rel.endsWith(".md") || !isMember(rel)) continue;
    const f = join(claude, rel);
    const text = readFileSync(f, "utf8");
    if (text.includes("${CLAUDE_PLUGIN_ROOT}") || /^agent:\s*["']?[a-z0-9-]+:/m.test(text.match(/^---\r?\n[\s\S]*?\r?\n---/)?.[0] ?? "")) leftovers++;
    const skillDir = rel.startsWith("skills/") ? join(claude, "skills", rel.split("/")[1]) : null;
    for (const mention of mentionsIn(text)) {
      if (mention.m.startsWith("../") && !rel.startsWith("skills/")) continue;
      if (!resolveMention(mention, f, { pluginRoot: join(claude, "crunchless", entry.plugin), projectRoot: vend, skillDir, skillHome: (n) => join(claude, "skills", n) })) broken.vendored.push(`${rel}: ${mention.m}`);
    }
  }
  check(!leftovers, `vendored members carry no \${CLAUDE_PLUGIN_ROOT} and no namespaced agent: (${leftovers} left)`);
  check(!broken.vendored.length, `member paths resolve in a vendored install${broken.vendored.length ? `: ${broken.vendored.slice(0, 8).join("; ")}${broken.vendored.length > 8 ? ` (+${broken.vendored.length - 8})` : ""}` : ""}`);
} catch (e) {
  check(false, `vendored install threw: ${String(e.stderr || e.message).trim().split("\n").slice(-2).join(" | ")}`);
}

// ---- Shared copies stay in step --------------------------------------------------------------
const sizeA = join(KIT, "plugins", "cl-web", "skills", "web-build-pack", "scripts", "size_report.mjs");
const sizeB = join(KIT, "plugins", "cl-ci", "skills", "ci-web-pipeline", "scripts", "size_report.mjs");
if (existsSync(sizeA) && existsSync(sizeB)) check(readFileSync(sizeA, "utf8") === readFileSync(sizeB, "utf8"), "cl-ci's size_report.mjs matches cl-web's");

// ---- Descriptions name only members this kit has ---------------------------------------------
const commands = new Set(plugins.flatMap((p) => (existsSync(join(p.dir, "commands")) ? readdirSync(join(p.dir, "commands")) : []).map((f) => f.replace(/\.md$/, ""))));
const named = plugins.flatMap((p) => [...p.description.matchAll(/\/(cl-[a-z0-9-]+)/g)].map((m) => [p.name, m[1]]));
const ghost = named.filter(([, c]) => !commands.has(c));
check(!ghost.length, `marketplace descriptions name only commands this kit has${ghost.length ? `: ${ghost.map(([p, c]) => `${p} names /${c}`).join(", ")}` : ""}`);
for (const p of plugins) {
  const manifest = join(p.dir, ".claude-plugin", "plugin.json");
  if (!existsSync(manifest)) continue;
  const desc = JSON.parse(readFileSync(manifest, "utf8")).description ?? "";
  const g = [...desc.matchAll(/\/(cl-[a-z0-9-]+)/g)].map((m) => m[1]).filter((c) => !commands.has(c));
  if (g.length) check(false, `${p.name}/.claude-plugin/plugin.json names missing commands: ${g.join(", ")}`);
}

// ---- Skill listing budget --------------------------------------------------------------------
// Every bundle but "everything" must fit Claude Code's skill listing budget (scripts/token_budget.mjs); "everything" is
// reported, never gated.
const budgetScript = join(KIT, "scripts", "token_budget.mjs");
if (existsSync(budgetScript)) {
  try {
    const budget = JSON.parse(run([budgetScript, "--json"]));
    const over = budget.rows.filter((r) => r.gated && !r.fits);
    check(!over.length, `every bundle fits the skill listing budget (${budget.budgetTokens} tokens, estimated)${over.length ? `: ${over.map((r) => `${r.bundle} ${r.estTokens}`).join(", ")}` : ""}`);
    for (const r of budget.rows.filter((x) => !x.gated)) console.log(`info "${r.bundle}" lists ${r.listed} members, about ${r.estTokens} tokens (${(r.estTokens / budget.budgetTokens).toFixed(1)}x the budget; not gated)`);
  } catch (e) {
    check(false, `token_budget.mjs failed: ${String(e.stderr || e.message).trim().split("\n")[0]}`);
  }
}

// ---- No placeholders in shipped files ---------------------------------------------------------
// Patterns are split so this file never matches itself. "<paid" is narrowed to the old URL placeholder: the studio
// SPEC template's "<paid installs | ...>" is a fill-in field for the user, not a kit placeholder.
const BANNED = [["<github", "-user>"], ["<this", "-repo>"], ["(P", "ro)"]].map((x) => x.join(""));
const PAID = new RegExp(["<pa", "id[^>|]*url>"].join(""), "i");
const shipped = walk(KIT, (p, e) => e.isDirectory() && /^(\.git|node_modules|dist|docs|site|brand|\.claude)$/.test(e.name) && dirname(p) === KIT)
  .filter((f) => /\.(md|json|mjs|js|py|txt|toml|yml|yaml)$/.test(f) && statSync(f).size < 2_000_000);
const hits = [];
for (const f of shipped) {
  const t = readFileSync(f, "utf8");
  for (const b of BANNED) if (t.includes(b)) hits.push(`${posix(relative(KIT, f))}: ${b}`);
  if (PAID.test(t)) hits.push(`${posix(relative(KIT, f))}: ${t.match(PAID)[0]}`);
}
check(!hits.length, `no placeholder or retired tier name in ${shipped.length} shipped files${hits.length ? `: ${hits.slice(0, 6).join("; ")}` : ""}`);

for (const d of temps) rmSync(d, { recursive: true, force: true });
console.log(fails.length ? `\n${fails.length} failure(s)` : "\nall smoke checks passed");
process.exit(fails.length ? 1 : 0);
