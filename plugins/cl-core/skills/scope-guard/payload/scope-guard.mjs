#!/usr/bin/env node
// Crunchless scope guard hook (Node 18+, no dependencies). Registered for SessionStart,
// PreToolUse (Write|Edit|MultiEdit and Bash|PowerShell), and Stop in .claude/settings.json.
// Reads the hook payload from stdin. Exit 2 blocks the call and shows the message to Claude.
// Config: .claude/scope-guard.json next to this file's project root. Fails open on any internal error.
// allowNew defaults to the detected engine's layout (ENGINE_LAYOUTS); a config allowNew replaces it.
// "ci": true in the config lets new files land in .github/workflows/ and .gitlab-ci.yml.
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, relative, resolve, isAbsolute } from "node:path";
import { execFileSync } from "node:child_process";

const DEFAULTS = {
  budget: 300,
  allowNew: ["src/**", "lib/**", "game/**", "Assets/**", "scenes/**", "scripts/**", "tests/**", "test/**", "docs/**", "levels/**", "assets/**"],
  denyNew: [".github/**", ".gitlab-ci.yml", "Dockerfile", "docker-compose*", ".vscode/**", ".idea/**", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md", ".editorconfig", ".prettierrc*", ".eslintrc*", "eslint.config.*", "Makefile"],
  manifests: ["package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb", "requirements*.txt", "pyproject.toml", "Pipfile*", "Cargo.toml", "Cargo.lock", "**/Packages/manifest.json", "**/Packages/packages-lock.json", "**/*.csproj", "**/Directory.Packages.props", "**/project.godot"],
  installCommands: ["\\bnpm\\s+(i|install|add)\\b", "\\bpnpm\\s+(add|install)\\b", "\\byarn\\s+add\\b", "\\bbun\\s+add\\b", "\\bpip3?\\s+install\\b", "\\bpoetry\\s+add\\b", "\\bcargo\\s+add\\b", "\\bdotnet\\s+add\\s+package\\b", "\\bgo\\s+get\\b", "\\bbrew\\s+install\\b", "\\bapt(-get)?\\s+install\\b"],
  excludeFromBudget: ["**/*.lock", "**/package-lock.json", "**/pnpm-lock.yaml", "dist/**", "build/**", "**/*.meta", "**/*.import", "**/*.png", "**/*.jpg", "**/*.wav", "**/*.ogg", "**/*.mp3", "**/*.glb", "**/*.fbx"],
};

// New-file folders per engine. Unity and web keep the generic DEFAULTS.allowNew.
const ENGINE_LAYOUTS = {
  unreal: { allowNew: ["Source/**", "Config/**", "Content/**", "Plugins/**"] },
  godot: { allowNew: ["**"], denyNew: [".godot/**"] },
  roblox: { allowNew: ["src/**"] },
  cocos: { allowNew: ["assets/**", "extensions/**"] },
};
const CI_PATHS = [".github/workflows/**", ".gitlab-ci.yml"];

function readJson(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
}
function detectEngine(root) {
  let names = [];
  try { names = readdirSync(root); } catch { return "web"; }
  const has = (re) => names.some((n) => re.test(n));
  if (has(/\.uproject$/i)) return "unreal";
  if (names.includes("project.godot")) return "godot";
  if (names.includes("default.project.json")) return "roblox";
  if (names.includes("package.json") && readJson(join(root, "package.json"))?.creator) return "cocos";
  if (names.includes("project.json") && /cocos/i.test(String(readJson(join(root, "project.json"))?.engine ?? ""))) return "cocos";
  if (existsSync(join(root, "ProjectSettings", "ProjectVersion.txt"))) return "unity";
  return "web";
}
function loadConfig(root) {
  const configPath = join(root, ".claude", "scope-guard.json");
  const user = existsSync(configPath) ? JSON.parse(readFileSync(configPath, "utf8")) : {};
  const engine = user.engine || detectEngine(root);
  const layout = ENGINE_LAYOUTS[engine] ?? {};
  return {
    ...DEFAULTS,
    allowNew: layout.allowNew ?? DEFAULTS.allowNew,
    denyNew: [...DEFAULTS.denyNew, ...(layout.denyNew ?? [])],
    ...user,
    engine,
  };
}

function globToRegex(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") { re += "(?:.*)"; i++; if (glob[i + 1] === "/") i++; }
      else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else if (".+^${}()|[]\\".includes(c)) re += "\\" + c;
    else re += c;
  }
  return new RegExp(`^${re}$`);
}
const matchAny = (path, globs) => globs.some((g) => globToRegex(g).test(path) || globToRegex(g).test(path.split("/").pop()));

function readStdin() {
  try { return JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { return {}; }
}
function gitRoot(cwd) {
  try { return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8" }).trim(); } catch { return null; }
}
function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}
function block(message) {
  process.stderr.write(`scope guard: ${message}\n`);
  process.exit(2);
}

function main() {
  const input = readStdin();
  const cwd = input.cwd || process.cwd();
  const root = gitRoot(cwd) || cwd;
  const config = loadConfig(root);
  const sessionId = input.session_id || "unknown";
  const event = input.hook_event_name || process.env.SCOPE_GUARD_EVENT || "";
  const baselineDir = join(root, ".git", "scope-guard");
  const baselineFile = join(baselineDir, sessionId);

  if (event === "Detect") { // used by the seeder to write the engine defaults into the config
    process.stdout.write(JSON.stringify({ engine: config.engine, allowNew: config.allowNew, denyNew: config.denyNew }));
    process.exit(0);
  }

  if (event === "SessionStart") {
    try {
      mkdirSync(baselineDir, { recursive: true });
      const head = git(["rev-parse", "HEAD"], root).trim();
      if (!existsSync(baselineFile)) writeFileSync(baselineFile, head);
    } catch { /* fresh repo without commits: no baseline, budget counts untracked only */ }
    process.exit(0);
  }

  if (event === "PreToolUse") {
    const tool = input.tool_name || "";
    const ti = input.tool_input || {};
    if (/^(Write|Edit|MultiEdit)$/.test(tool)) {
      const target = ti.file_path || ti.path || "";
      if (!target) process.exit(0);
      const abs = isAbsolute(target) ? target : resolve(cwd, target);
      const rel = relative(root, abs).replace(/\\/g, "/");
      if (rel.startsWith("..")) process.exit(0);
      if (matchAny(rel, config.manifests)) block(`${rel} is a dependency manifest. Adding or changing dependencies needs the user's yes. Ask, then the user edits it or allows it in .claude/scope-guard.json.`);
      const isNew = !existsSync(abs);
      if (isNew) {
        if (config.ci === true && CI_PATHS.some((g) => globToRegex(g).test(rel))) process.exit(0);
        if (matchAny(rel, config.denyNew)) block(`${rel} is outside the scope: tooling, CI, editor, or contributor files are not created unless the user asks.`);
        if (config.allowNew.length && !matchAny(rel, config.allowNew)) block(`new file ${rel} is outside the allowed folders (${config.allowNew.join(", ")}). Put it in scope or ask the user.`);
      }
      process.exit(0);
    }
    if (/^(Bash|PowerShell)$/.test(tool)) {
      const cmd = String(ti.command || "");
      for (const pattern of config.installCommands) {
        if (new RegExp(pattern, "i").test(cmd)) block(`install command blocked (${pattern}). New dependencies need the user's yes.`);
      }
      process.exit(0);
    }
    process.exit(0);
  }

  if (event === "Stop") {
    if (input.stop_hook_active) process.exit(0); // second stop: never deadlock
    let changed = 0;
    const counted = [];
    try {
      const base = existsSync(baselineFile) ? readFileSync(baselineFile, "utf8").trim() : null;
      const numstat = base ? git(["diff", "--numstat", base], root) : git(["diff", "--numstat"], root);
      for (const line of numstat.split("\n")) {
        const [a, d, file] = line.split("\t");
        if (!file || a === "-" ) continue;
        if (matchAny(file, config.excludeFromBudget)) continue;
        const n = Number(a) + Number(d); changed += n; counted.push([file, n]);
      }
      const untracked = git(["ls-files", "--others", "--exclude-standard"], root).split("\n").filter(Boolean);
      for (const file of untracked) {
        if (matchAny(file, config.excludeFromBudget)) continue;
        try { const n = readFileSync(join(root, file), "utf8").split("\n").length; changed += n; counted.push([file, n]); } catch { /* binary */ }
      }
    } catch { process.exit(0); }
    if (changed > config.budget) {
      const top = counted.sort((x, y) => y[1] - x[1]).slice(0, 5).map(([f, n]) => `${f} (${n})`).join(", ");
      block(`${changed} changed lines exceed the session budget of ${config.budget}. Largest: ${top}. Run /scope-check, cut the extras, or ask the user to raise the budget in .claude/scope-guard.json.`);
    }
    process.exit(0);
  }
  process.exit(0);
}

try { main(); } catch { process.exit(0); }
