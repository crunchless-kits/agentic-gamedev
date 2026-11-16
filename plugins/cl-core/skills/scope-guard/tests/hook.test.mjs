#!/usr/bin/env node
// Unit cases for the scope guard hook and seeder. Creates a temp git repo. Exit 1 on failure.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = mkdtempSync(join(tmpdir(), "scope-guard-"));
const fails = [];
let passed = 0;
const ok = (cond, name) => { console.log(`${cond ? "ok  " : "FAIL"} ${name}`); if (cond) passed++; else fails.push(name); };
const sh = (cmd, args) => execFileSync(cmd, args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

sh("git", ["init", "-q"]); sh("git", ["config", "user.email", "t@t"]); sh("git", ["config", "user.name", "t"]);
mkdirSync(join(repo, "src")); writeFileSync(join(repo, "src", "main.ts"), "export const a = 1;\n"); writeFileSync(join(repo, "package.json"), "{}\n");
sh("git", ["add", "-A"]); sh("git", ["commit", "-qm", "init"]);

// seed twice: second run byte-identical
const seedArgs = ["--project", repo, "--scope", "Add a pause menu", "--budget", "40", "--local-only"];
execFileSync("node", [join(HERE, "scripts", "seed.mjs"), ...seedArgs], { encoding: "utf8" });
const snap = () => ["CLAUDE.md", ".claude/hooks/scope-guard.mjs", ".claude/settings.json", ".claude/scope-guard.json", ".claude/skills/scope-check/SKILL.md", ".claude/skills/calibrated-review/SKILL.md"].map((f) => readFileSync(join(repo, f), "utf8")).join("\u0000");
const first = snap();
const second = execFileSync("node", [join(HERE, "scripts", "seed.mjs"), ...seedArgs], { encoding: "utf8" });
ok(snap() === first, "seed re-run is byte-identical");
ok(/unchanged\s+CLAUDE\.md/.test(second), "seed reports CLAUDE.md unchanged on re-run");
ok(readFileSync(join(repo, ".git", "info", "exclude"), "utf8").includes(".claude/"), "--local-only excludes agent files");
const settings = JSON.parse(readFileSync(join(repo, ".claude", "settings.json"), "utf8"));
ok(settings.hooks.PreToolUse.length === 2 && settings.hooks.Stop.length === 1 && settings.hooks.SessionStart.length === 1, "settings hold the four hook registrations");

const hook = join(repo, ".claude", "hooks", "scope-guard.mjs");
const run = (payload) => { const r = spawnSync("node", [hook], { cwd: repo, input: JSON.stringify({ cwd: repo, session_id: "s1", ...payload }), encoding: "utf8" }); return { code: r.status, err: r.stderr }; };

ok(run({ hook_event_name: "SessionStart" }).code === 0 && existsSync(join(repo, ".git", "scope-guard", "s1")), "SessionStart records a baseline");
ok(run({ hook_event_name: "PreToolUse", tool_name: "Write", tool_input: { file_path: join(repo, "src", "pause.ts") } }).code === 0, "new file inside allowlist is allowed");
let r = run({ hook_event_name: "PreToolUse", tool_name: "Write", tool_input: { file_path: join(repo, ".github", "workflows", "ci.yml") } });
ok(r.code === 2 && /outside the scope/.test(r.err), "new CI file is denied");
r = run({ hook_event_name: "PreToolUse", tool_name: "Write", tool_input: { file_path: join(repo, "tools", "helper.ts") } });
ok(r.code === 2 && /outside the allowed folders/.test(r.err), "new file outside allowlist is denied");
ok(run({ hook_event_name: "PreToolUse", tool_name: "Edit", tool_input: { file_path: join(repo, "src", "main.ts") } }).code === 0, "editing an existing allowed file passes");
r = run({ hook_event_name: "PreToolUse", tool_name: "Edit", tool_input: { file_path: join(repo, "package.json") } });
ok(r.code === 2 && /dependency manifest/.test(r.err), "editing a manifest is denied");
r = run({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "npm install lodash" } });
ok(r.code === 2 && /install command blocked/.test(r.err), "install command is denied");
ok(run({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "npm test" } }).code === 0, "non-install command passes");
ok(run({ hook_event_name: "Stop" }).code === 0, "Stop within budget passes");
writeFileSync(join(repo, "src", "big.ts"), Array.from({ length: 60 }, (_, i) => `export const v${i} = ${i};`).join("\n") + "\n");
r = run({ hook_event_name: "Stop" });
ok(r.code === 2 && /exceed the session budget/.test(r.err), "Stop over budget is blocked with the largest files named");
ok(run({ hook_event_name: "Stop", stop_hook_active: true }).code === 0, "second Stop is allowed (no deadlock)");
writeFileSync(join(repo, "package-lock.json"), Array.from({ length: 500 }, () => "x").join("\n"));
rmSync(join(repo, "src", "big.ts"));
ok(run({ hook_event_name: "Stop" }).code === 0, "excluded globs do not count toward the budget");
r = spawnSync("node", [hook], { cwd: repo, input: "not json", encoding: "utf8" });
ok(r.status === 0, "malformed input fails open");

rmSync(repo, { recursive: true, force: true });

// Engine layouts: allowNew comes from the detected engine when the config sets none.
const payloadHook = join(HERE, "payload", "scope-guard.mjs");
function engineRepo(files, config) {
  const dir = mkdtempSync(join(tmpdir(), "scope-guard-engine-"));
  for (const [rel, body] of Object.entries(files)) { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), body); }
  if (config) { mkdirSync(join(dir, ".claude"), { recursive: true }); writeFileSync(join(dir, ".claude", "scope-guard.json"), JSON.stringify(config)); }
  const write = (rel) => spawnSync("node", [payloadHook], { cwd: dir, input: JSON.stringify({ cwd: dir, session_id: "e", hook_event_name: "PreToolUse", tool_name: "Write", tool_input: { file_path: join(dir, rel) } }), encoding: "utf8" }).status;
  return { dir, write };
}
const engineCases = [
  ["unreal", { "Game.uproject": "{}" }, ["Source/MyGame/Enemy.cpp", "Content/Maps/L1.umap", "Config/DefaultGame.ini", "Plugins/Fx/Fx.uplugin"], ["tools/helper.py"]],
  ["godot", { "project.godot": "" }, ["player/player.gd", "enemies/slime/slime.tscn"], [".godot/imported/x.ctex"]],
  ["roblox", { "default.project.json": "{}" }, ["src/server/Main.server.luau"], ["tools/helper.luau"]],
  ["cocos", { "package.json": JSON.stringify({ creator: { version: "3.8.0" } }) }, ["assets/scripts/Player.ts", "extensions/tool/main.js"], ["tools/helper.ts"]],
  ["unity", { "ProjectSettings/ProjectVersion.txt": "m_EditorVersion: 6000.0.0f1\n" }, ["Assets/Scripts/Player.cs"], ["Source/Player.cs"]],
];
for (const [engine, files, allowedPaths, deniedPaths] of engineCases) {
  const { dir, write } = engineRepo(files);
  ok(allowedPaths.every((p) => write(p) === 0), `${engine}: new files in its normal layout are allowed (${allowedPaths.join(", ")})`);
  ok(deniedPaths.every((p) => write(p) === 2), `${engine}: new files outside its layout are denied (${deniedPaths.join(", ")})`);
  rmSync(dir, { recursive: true, force: true });
}
{
  const { dir, write } = engineRepo({ "Game.uproject": "{}" }, { allowNew: ["Source/**"] });
  ok(write("Content/Maps/L1.umap") === 2, "a config allowNew replaces the engine layout");
  rmSync(dir, { recursive: true, force: true });
}
{
  const { dir, write } = engineRepo({ "src/main.ts": "" }, { ci: true });
  ok(write(".github/workflows/ci.yml") === 0, "\"ci\": true allows new workflow files");
  ok(write(".github/ISSUE_TEMPLATE/bug.md") === 2, "\"ci\": true still denies other .github files");
  rmSync(dir, { recursive: true, force: true });
}
{
  const dir = mkdtempSync(join(tmpdir(), "scope-guard-seed-"));
  writeFileSync(join(dir, "Game.uproject"), "{}");
  execFileSync("node", [join(HERE, "scripts", "seed.mjs"), "--project", dir, "--scope", "Add a pause menu", "--ci"], { encoding: "utf8" });
  const cfg = JSON.parse(readFileSync(join(dir, ".claude", "scope-guard.json"), "utf8"));
  ok(cfg.engine === "unreal" && cfg.allowNew.includes("Source/**") && cfg.ci === true, "seeder writes the detected engine, its allowNew, and --ci into a new config");
  rmSync(dir, { recursive: true, force: true });
}

const total = fails.length + passed;
console.log(fails.length ? `\n${fails.length} of ${total} scope guard cases failed` : `\nall ${total} scope guard cases passed`);
process.exit(fails.length ? 1 : 0);
