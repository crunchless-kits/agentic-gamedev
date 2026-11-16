#!/usr/bin/env node
// Scope guard seeder. Idempotent: a re-run writes byte-identical files and never overwrites settings.
//   node seed.mjs --project <repo> --scope "<one sentence>" [--budget 300] [--ci] [--local-only] [--dry-run]
// Writes: CLAUDE.md block (between markers), .claude/skills/scope-check, .claude/skills/calibrated-review,
//         .claude/hooks/scope-guard.mjs, .claude/scope-guard.json (if missing), hooks merged into .claude/settings.json.
// A new config records the detected engine and its allowNew folders; --ci also allows new CI workflow files.
// --local-only also adds those paths to .git/info/exclude so the repo tracks no agent files.
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k, d = null) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const project = resolve(opt("--project", "."));
const scope = opt("--scope");
const budget = Number(opt("--budget", 300));
const localOnly = args.includes("--local-only");
const ci = args.includes("--ci");
const dryRun = args.includes("--dry-run");
if (!scope) { console.error("--scope \"<one sentence>\" is required"); process.exit(2); }

const START = "<!-- crunchless:scope-guard:start -->", END = "<!-- crunchless:scope-guard:end -->";
const block = `${START}\n${readFileSync(join(HERE, "payload", "CLAUDE-block.md"), "utf8").trim().replace("{{SCOPE}}", scope).replace("{{BUDGET}}", String(budget))}\n${END}`;
const written = [];
function put(rel, content) {
  const path = join(project, rel);
  if (existsSync(path) && readFileSync(path, "utf8") === content) return written.push([rel, "unchanged"]);
  if (!dryRun) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content); }
  written.push([rel, existsSync(path) ? "updated" : "created"]);
}

// 1. CLAUDE.md block
const claudePath = join(project, "CLAUDE.md");
let claude = existsSync(claudePath) ? readFileSync(claudePath, "utf8") : "";
const s = claude.indexOf(START), e = claude.indexOf(END);
const next = s !== -1 && e !== -1 ? claude.slice(0, s) + block + claude.slice(e + END.length) : `${claude.replace(/\s*$/, "")}${claude ? "\n\n" : ""}${block}\n`;
put("CLAUDE.md", next);

// 2. skills (copied from the kit so repos without the kit still have them)
for (const name of ["scope-check", "calibrated-review"]) {
  const src = join(HERE, "..", name, "SKILL.md");
  put(`.claude/skills/${name}/SKILL.md`, readFileSync(src, "utf8"));
}

// 3. hook + config
put(".claude/hooks/scope-guard.mjs", readFileSync(join(HERE, "payload", "scope-guard.mjs"), "utf8"));
const configPath = join(project, ".claude", "scope-guard.json");
let engine = null;
if (!existsSync(configPath)) {
  // The hook owns engine detection; ask it so the seeder and the hook never disagree.
  const probe = spawnSync("node", [join(HERE, "payload", "scope-guard.mjs")], { input: JSON.stringify({ hook_event_name: "Detect", cwd: project }), encoding: "utf8" });
  let detected = null;
  try { detected = JSON.parse(probe.stdout); } catch { /* fall back to the hook's runtime detection */ }
  engine = detected?.engine ?? null;
  const config = { budget, ...(detected ? { engine: detected.engine, allowNew: detected.allowNew } : {}), ...(ci ? { ci: true } : {}), note: "Budget is a starting guess, not a measured value. allowNew was seeded from the detected engine. Set \"ci\": true to allow new files in .github/workflows/ and .gitlab-ci.yml. Edit allowNew, denyNew, manifests, installCommands, excludeFromBudget to taste; defaults live in the hook." };
  put(".claude/scope-guard.json", JSON.stringify(config, null, 2) + "\n");
} else written.push([".claude/scope-guard.json", "kept"]);

// 4. settings merge (never overwrite other hooks)
const settingsPath = join(project, ".claude", "settings.json");
const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, "utf8")) : {};
settings.hooks ??= {};
const cmd = "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/scope-guard.mjs\"";
const wanted = { SessionStart: [""], PreToolUse: ["Write|Edit|MultiEdit", "Bash|PowerShell"], Stop: [""] };
let settingsChanged = false;
for (const [event, matchers] of Object.entries(wanted)) {
  settings.hooks[event] ??= [];
  for (const matcher of matchers) {
    const exists = settings.hooks[event].some((h) => (h.matcher ?? "") === matcher && (h.hooks ?? []).some((x) => x.command === cmd));
    if (!exists) { settings.hooks[event].push(matcher ? { matcher, hooks: [{ type: "command", command: cmd }] } : { hooks: [{ type: "command", command: cmd }] }); settingsChanged = true; }
  }
}
if (settingsChanged) put(".claude/settings.json", JSON.stringify(settings, null, 2) + "\n"); else written.push([".claude/settings.json", "unchanged"]);

// 5. local-only: keep agent files out of the repo
if (localOnly) {
  const exclude = join(project, ".git", "info", "exclude");
  if (existsSync(dirname(exclude))) {
    const current = existsSync(exclude) ? readFileSync(exclude, "utf8") : "";
    const lines = ["CLAUDE.md", ".claude/", "AI_USAGE.md"].filter((l) => !current.split("\n").includes(l));
    if (lines.length && !dryRun) appendFileSync(exclude, `${current.endsWith("\n") || !current ? "" : "\n"}${lines.join("\n")}\n`);
    written.push([".git/info/exclude", lines.length ? "updated" : "unchanged"]);
  }
}

console.log(`${dryRun ? "DRY RUN " : ""}scope guard seeded in ${project}`);
for (const [rel, status] of written) console.log(`  ${status.padEnd(9)} ${rel}`);
console.log(`Scope: ${scope}\nEngine: ${engine ?? "kept from the existing config"}${ci && engine ? " (CI files allowed)" : ""}\nBudget: ${budget} lines (starting guess)\nNext: open Claude Code in the repo; the hook records the session baseline at start.`);
