#!/usr/bin/env node
// Crunchless doctor: environment facts a first run depends on. Read-only. Prints JSON.
// Usage: node doctor.mjs [project-root]
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { detectEngine } from "./detect-engine.mjs";
const root = resolve(process.argv[2] ?? ".");
const sh = (c) => { try { return execSync(c, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return null; } };
const settingsPath = join(root, ".claude", "settings.json");
const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, "utf8")) : {};
const hookCmds = Object.values(settings.hooks ?? {}).flat().flatMap((h) => (h.hooks ?? []).map((x) => x.command));
const guardCount = hookCmds.filter((c) => /guard-bash\.mjs/.test(c)).length;
const scopeCount = hookCmds.filter((c) => /scope-guard\.mjs/.test(c)).length;
const tracked = sh("git ls-files -- CLAUDE.md .claude .cl") ?? "";
const manifestPath = join(root, ".claude", "crunchless.manifest.json");
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : null;
// Description load. Claude Code lists skill and command descriptions in a budget of about 1% of the context window;
// past it, descriptions of the least-used skills are cut. 1% of a 200K-token window is about 2,000 tokens, roughly
// 8,000 characters. That figure is an estimate (4 characters per token), not a published limit.
const BUDGET_CHARS = 8000;
const listed = { members: 0, characters: 0 }, agentLoad = { members: 0, characters: 0 };
function countDir(base, source) {
  for (const kind of ["agents", "skills", "commands"]) {
    const dir = join(base, kind);
    if (!existsSync(dir)) continue;
    const files = kind === "skills" ? readdirSync(dir).map((d) => join(dir, d, "SKILL.md")).filter(existsSync) : readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => join(dir, f));
    for (const f of files) {
      const text = readFileSync(f, "utf8");
      const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
      const m = fm.match(/^description:\s*(.+)$/m);
      if (!m) continue;
      if (/^disable-model-invocation:\s*true/m.test(fm)) continue; // never listed for the model
      const into = kind === "agents" ? agentLoad : listed;
      into.members++; into.characters += m[1].replace(/^["']|["']$/g, "").length;
    }
  }
  sources.push(source);
}
const sources = [];
countDir(join(root, ".claude"), "vendored (.claude/)");
// Plugin installs: every installed cl-* plugin listed in ~/.claude/plugins/installed_plugins.json.
try {
  const installed = JSON.parse(readFileSync(join(homedir(), ".claude", "plugins", "installed_plugins.json"), "utf8"));
  for (const [key, entries] of Object.entries(installed.plugins ?? {})) {
    if (!/^cl-[a-z0-9-]+@/.test(key)) continue;
    const entry = [].concat(entries).find((e) => e?.installPath && existsSync(e.installPath));
    if (entry) countDir(entry.installPath, `plugin ${key}`);
  }
} catch { /* no plugin installs, or an unknown file shape */ }
const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const report = {
  node: process.version, nodeOk: Number(process.version.slice(1).split(".")[0]) >= 22,
  claudeCode: sh("claude --version"),
  python: sh("python3 --version") ?? sh("python --version"),
  overrides: { CLAUDE_CODE_EFFORT_LEVEL: process.env.CLAUDE_CODE_EFFORT_LEVEL ?? null, CLAUDE_CODE_SUBAGENT_MODEL_FORCE: process.env.CLAUDE_CODE_SUBAGENT_MODEL_FORCE ?? null, CLAUDE_CODE_SUBAGENT_MODEL: process.env.CLAUDE_CODE_SUBAGENT_MODEL ?? null },
  hooks: { guardRegistrations: guardCount, scopeGuardRegistrations: scopeCount, note: guardCount > 1 || scopeCount > 3 ? "duplicate registrations; dedupe .claude/settings.json" : "ok" },
  vendored: manifest ? { kitVersion: manifest.kitVersion, files: Object.keys(manifest.files).length } : null,
  trackedAgentFiles: tracked ? tracked.split("\n") : [],
  descriptionLoad: {
    skillsAndCommands: listed,
    agents: agentLoad,
    budgetCharacters: BUDGET_CHARS,
    budgetIsEstimate: "about 1% of a 200K-token context window at about 4 characters per token; larger windows get more",
    overBudget: listed.characters > BUDGET_CHARS,
    note: listed.characters > BUDGET_CHARS
      ? `WARNING: ${listed.characters} description characters against an estimated budget of ${BUDGET_CHARS}. Claude Code will cut the descriptions of the skills you use least. Install fewer plugins (one engine bundle, then add-ons only as needed).`
      : "within the estimated budget",
    counted: sources,
  },
  kitIndex: existsSync(join(pluginRoot, "kit-index.json")) ? join(pluginRoot, "kit-index.json") : null,
  forkAndPaths: "declared in frontmatter; not honored for plugin skills on Claude Code 2.1.318 in a live test; re-test on your version by invoking a forked skill and reading /tasks",
  engineDetected: detectEngine(root),
};
console.log(JSON.stringify(report, null, 2));
