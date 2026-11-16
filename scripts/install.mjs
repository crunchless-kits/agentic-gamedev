#!/usr/bin/env node
// Crunchless installer.
// Copies selected plugins into a game project's .claude/ folder so the kit travels with the repo
// (needed for cloud or CI sessions where user-level plugins are not installed).
//
// Usage, from anywhere:
//   node scripts/install.mjs --project /path/to/game [--plugins core,web] [--dry-run] [--force]
//   node scripts/install.mjs --list
//
// Safety model (mirrors what a good installer should do):
//   - new file            -> installed
//   - unchanged kit file  -> skipped, reported as up to date
//   - kit file you edited -> left alone, reported as a conflict (use --force to overwrite)
//   - file not from kit   -> left alone, reported as a conflict (use --force to overwrite)
//   - CLAUDE.md           -> one managed block between markers; file is backed up before the block changes
//
// Node 22+, no dependencies.

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const KIT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const KIT_META = (() => { try { return JSON.parse(readFileSync(join(KIT_ROOT, "package.json"), "utf8")).kit ?? {}; } catch { return {}; } })();
const PREFIX = KIT_META.prefix ?? "cl";
const MANIFEST_NAME = "crunchless.manifest.json";
const BLOCK_START = "<!-- crunchless:start -->";
const BLOCK_END = "<!-- crunchless:end -->";
const COPY_KINDS = ["agents", "commands", "skills"];
// Plugin-root files that members read at run time. Vendored under .claude/crunchless/<plugin>/ so engines never collide.
const PLUGIN_EXTRAS = ["scripts", "hooks", "references", "primitives.json", "mcp.example.json", "kit-index.json"];
const VENDOR_DIR = "crunchless"; // .claude/crunchless/<plugin>/
// No plugin depends on another plugin's files. Every plugin needs the core: forked skills name cl-builder and cl-scout,
// and the router holds the shared rules. --no-deps skips even that.
const CORE_FOR_ALL = true;
// Editions (export_edition.mjs) list what they leave out, so a request for a missing plugin gets a clear note.
const EDITION = (() => { try { return JSON.parse(readFileSync(join(KIT_ROOT, "upgrade-members.json"), "utf8")); } catch { return null; } })();
// Install bundles: named plugin sets, kept in bundles.json at the kit root. --bundle <name> (--profile is an alias)
const PROFILES = (() => { try { return JSON.parse(readFileSync(join(KIT_ROOT, "bundles.json"), "utf8")); } catch { return { everything: null }; } })();

function parseArgs(argv) {
  const args = { project: process.cwd(), plugins: null, dryRun: false, force: false, list: false, help: false, noDeps: false, localOnly: false, noHooks: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--project" || a === "-p") args.project = resolve(argv[++i] ?? ".");
    else if (a === "--plugins") args.plugins = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--bundle" || a === "--profile") {
      // One engine bundle plus add-ons combine with commas: --bundle unity,mobile,multiplayer
      const names = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      for (const name of names) if (!(name in PROFILES)) { console.error(`Unknown bundle "${name}". Bundles: ${Object.keys(PROFILES).join(", ")}`); process.exit(2); }
      for (const name of names) {
        const gap = EDITION?.bundleGaps?.[name] ?? [];
        if (!gap.length) continue;
        const where = [...new Set(gap.map((g) => tierLabel(EDITION.missingPlugins?.[g])))].join(" or ");
        const onlyCore = (PROFILES[name] ?? []).every((n) => /-(core|assistant)$/.test(n));
        console.warn(onlyCore
          ? `Note: bundle "${name}": this bundle's plugins (${gap.join(", ")}) are in ${where}. This edition installs only the core for it. Upgrade: ${EDITION.upgradeUrl}`
          : `Note: bundle "${name}" also includes ${gap.join(", ")} in the ${where} edition; this edition installs the rest.`);
      }
      args.plugins = names.some((n) => PROFILES[n] === null) ? null : [...new Set(names.flatMap((n) => PROFILES[n]))];
    }
    else if (a === "--local-only") args.localOnly = true;
    else if (a === "--no-hooks") args.noHooks = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--force") args.force = true;
    else if (a === "--list") args.list = true;
    else if (a === "--no-deps") args.noDeps = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else {
      console.error(`Unknown argument: ${a}`);
      args.help = true;
    }
  }
  return args;
}

function tierLabel(tier) {
  return { free: "Free", builder: "Builder", studio: "Studio" }[tier] ?? "Builder or Studio";
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function loadMarketplace() {
  const path = join(KIT_ROOT, ".claude-plugin", "marketplace.json");
  const data = readJson(path);
  return data.plugins.map((p) => ({
    name: p.name,
    shortName: p.name.replace(new RegExp(`^${PREFIX}-`), ""),
    description: p.description ?? "",
    dir: resolve(KIT_ROOT, p.source),
  }));
}

function kitVersion() {
  try {
    return readJson(join(KIT_ROOT, "package.json")).version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function selectPlugins(all, wanted, noDeps) {
  if (!wanted) return all;
  const chosen = [];
  const add = (match, why) => {
    if (chosen.includes(match)) return;
    chosen.push(match);
    if (why) console.log(`Including ${match.name} (${why}); pass --no-deps to skip.`);
    if (noDeps) return;
    const deps = [];
    if (CORE_FOR_ALL && !match.name.endsWith("-core")) deps.push(all.find((p) => p.name.endsWith("-core"))?.name);
    for (const dep of deps) {
      const d = all.find((p) => p.name === dep);
      if (d) add(d, `required by ${match.name}`);
    }
  };
  for (const w of wanted) {
    const match = all.find((p) => p.name === w || p.shortName === w);
    const full = w.startsWith(`${PREFIX}-`) ? w : `${PREFIX}-${w}`;
    if (!match && EDITION?.missingPlugins?.[full]) {
      console.warn(`Warning: ${full} is not in this edition; it is in ${tierLabel(EDITION.missingPlugins[full])}. Skipping it. Upgrade: ${EDITION.upgradeUrl}`);
      continue;
    }
    if (!match) {
      console.error(`Unknown plugin "${w}". Available: ${all.map((p) => p.shortName).join(", ")}`);
      process.exit(2);
    }
    add(match, null);
  }
  // keep marketplace order so core lands first
  return all.filter((p) => chosen.includes(p));
}

// Returns [{ src, dest, rel, plugin }] where rel is relative to <project>/.claude
function collectFiles(plugins, claudeDir) {
  const files = [];
  for (const plugin of plugins) {
    for (const kind of COPY_KINDS) {
      const kindDir = join(plugin.dir, kind);
      if (!existsSync(kindDir)) continue;
      for (const src of walk(kindDir)) {
        const rel = join(kind, relative(kindDir, src));
        if (rel.split(/[\\/]/).includes("evals")) continue; // test cases stay in the kit repo
        files.push({ src, dest: join(claudeDir, rel), rel, plugin: plugin.name });
      }
    }
    for (const extra of PLUGIN_EXTRAS) {
      const path = join(plugin.dir, extra);
      if (!existsSync(path)) continue;
      for (const src of statSync(path).isDirectory() ? walk(path) : [path]) {
        const rel = join(VENDOR_DIR, plugin.name, relative(plugin.dir, src));
        files.push({ src, dest: join(claudeDir, rel), rel, plugin: plugin.name });
      }
    }
  }
  return files;
}

// Vendored members are not namespaced and have no ${CLAUDE_PLUGIN_ROOT}, so every plugin path points at its vendored home:
//   ${CLAUDE_PLUGIN_ROOT}/skills|agents|commands/  -> .claude/skills|agents|commands/
//   ${CLAUDE_PLUGIN_ROOT}/<anything else>          -> .claude/crunchless/<plugin>/<anything else>
//   ../../primitives.json and friends in SKILL.md  -> ../../crunchless/<plugin>/primitives.json
//   frontmatter agent: cl-core:<name>              -> agent: <name>
export function vendorText(text, plugin, rel) {
  const posixRel = rel.split(/[\\/]/).join("/");
  let out = text
    .replace(/\$\{CLAUDE_PLUGIN_ROOT\}\/(skills|agents|commands)\//g, ".claude/$1/")
    .replaceAll("${CLAUDE_PLUGIN_ROOT}", `.claude/${VENDOR_DIR}/${plugin}`);
  if (/^skills\/[^/]+\/SKILL\.md$/.test(posixRel)) {
    out = out.replace(/\.\.\/\.\.\/(primitives\.json|mcp\.example\.json|kit-index\.json|scripts\/|references\/|hooks\/)/g, `../../${VENDOR_DIR}/${plugin}/$1`);
  }
  return out.replace(/^---\r?\n[\s\S]*?\r?\n---/, (fm) => fm.replace(/^agent:\s*(["']?)[a-z0-9-]+:([a-z0-9-]+)\1[ \t]*$/m, "agent: $2"));
}

function sourceBuffer(file) {
  const buf = readFileSync(file.src);
  if (!file.src.endsWith(".md") || file.rel.startsWith(VENDOR_DIR)) return buf;
  const text = buf.toString("utf8");
  const next = vendorText(text, file.plugin, file.rel);
  return next === text ? buf : Buffer.from(next, "utf8");
}

function countMembers(plugin) {
  const counts = { agents: 0, skills: 0, commands: 0 };
  const agents = join(plugin.dir, "agents");
  const commands = join(plugin.dir, "commands");
  const skills = join(plugin.dir, "skills");
  if (existsSync(agents)) counts.agents = readdirSync(agents).filter((f) => f.endsWith(".md")).length;
  if (existsSync(commands)) counts.commands = readdirSync(commands).filter((f) => f.endsWith(".md")).length;
  if (existsSync(skills)) {
    counts.skills = readdirSync(skills, { withFileTypes: true }).filter(
      (d) => d.isDirectory() && existsSync(join(skills, d.name, "SKILL.md")),
    ).length;
  }
  return counts;
}

// The commands line is built from the commands actually installed, so the block never names a missing one.
export function commandsLine(installedPlugins) {
  const rows = [];
  for (const p of installedPlugins) {
    const dir = join(p.dir, "commands");
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".md")).sort()) {
      const fm = readFileSync(join(dir, f), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
      const desc = (fm.match(/^description:\s*(.+)$/m)?.[1] ?? "").replace(/^["']|["']$/g, "").split(/[:.]/)[0].trim();
      rows.push(`\`/${f.replace(/\.md$/, "")}\` ${desc.charAt(0).toLowerCase()}${desc.slice(1)}`);
    }
  }
  return rows.length ? `- Commands: ${rows.join("; ")}.` : "";
}

function buildBlock(installedPlugins, version) {
  const templatePath = join(KIT_ROOT, "plugins", "cl-core", "claude-md-block.md");
  const raw = existsSync(templatePath) ? readFileSync(templatePath, "utf8").trim() : "## Crunchless";
  const line = commandsLine(installedPlugins);
  const template = raw.replace(/^\{\{commands\}\}[ \t]*(\r?\n)?/m, () => (line ? `${line}\n` : ""));
  const list = installedPlugins.map((p) => `\`${p.name}\``).join(", ");
  return `${BLOCK_START}\n${template}\n\nInstalled plugins (kit v${version}): ${list}.\n${BLOCK_END}`;
}

function updateClaudeMd(projectDir, block, dryRun) {
  const path = join(projectDir, "CLAUDE.md");
  if (!existsSync(path)) {
    if (!dryRun) writeFileSync(path, `${block}\n`);
    return dryRun ? "would be created" : "created";
  }
  const current = readFileSync(path, "utf8");
  const start = current.indexOf(BLOCK_START);
  const end = current.indexOf(BLOCK_END);
  let next;
  if (start !== -1 && end !== -1 && end > start) {
    next = current.slice(0, start) + block + current.slice(end + BLOCK_END.length);
  } else {
    next = `${current.replace(/\s*$/, "")}\n\n${block}\n`;
  }
  if (next === current) return "up to date";
  if (!dryRun) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    writeFileSync(`${path}.crunchless-backup-${stamp}`, current);
    writeFileSync(path, next);
  }
  const action = start !== -1 ? "updated" : "appended";
  return dryRun ? `would be ${action} (backup would be written)` : `${action} (backup written)`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Crunchless installer

Usage:
  node scripts/install.mjs --project <game-root> [--plugins core,web,design,release] [--dry-run] [--force]
  node scripts/install.mjs --list

Options:
  --project, -p   Game project root (default: current directory)
  --plugins       Comma-separated plugin names; short (web) or full (cl-web). Default: all
  --bundle        Named plugin set from bundles.json (one engine bundle: unity, web, roblox, unreal, godot, cocos; add-ons: web-portals, playables, mobile, live-ops, multiplayer, content, marketing, studio; or everything). Combine with commas: --bundle unity,mobile. Drop cl-assistant by listing plugins explicitly
  --local-only    Also add CLAUDE.md and .claude/ to .git/info/exclude so the repo tracks no agent files
  --no-hooks      Skip wiring the guard hook into .claude/settings.json
  --dry-run       Report what would change without writing
  --force         Overwrite files you edited or files not installed by the kit
  --list          Show available plugins and member counts
  --no-deps       Do not auto-include cl-core with the plugins you name

Plugin scripts, references, hooks, primitives.json, mcp.example.json, and kit-index.json land in
.claude/crunchless/<plugin>/. Member files that name \${CLAUDE_PLUGIN_ROOT} are rewritten to point there.
`);
    return;
  }

  const all = loadMarketplace();
  const version = kitVersion();

  if (args.list) {
    console.log(`Crunchless v${version} bundles: ${Object.entries(PROFILES).map(([k, v]) => `${k} (${v ? v.length : "all"})`).join(", ")}`);
    console.log(`Crunchless v${version} plugins:`);
    for (const p of all) {
      const c = countMembers(p);
      console.log(`  ${p.shortName.padEnd(8)} ${c.agents} agents, ${c.skills} skills, ${c.commands} commands  ${p.description}`);
    }
    return;
  }

  const projectDir = args.project;
  if (!existsSync(projectDir) || !statSync(projectDir).isDirectory()) {
    console.error(`Project directory not found: ${projectDir}`);
    process.exit(2);
  }
  if (resolve(projectDir) === KIT_ROOT) {
    console.error("Refusing to install the kit into itself. Pass --project <game-root>.");
    process.exit(2);
  }

  const plugins = selectPlugins(all, args.plugins, args.noDeps);
  const claudeDir = join(projectDir, ".claude");
  const manifestPath = join(claudeDir, MANIFEST_NAME);
  const manifest = existsSync(manifestPath) ? readJson(manifestPath) : { kitVersion: null, files: {} };
  const nextManifest = { kitVersion: version, installedAt: new Date().toISOString(), files: { ...manifest.files } };

  const results = { installed: [], updated: [], unchanged: [], conflict: [], overwritten: [] };

  for (const file of collectFiles(plugins, claudeDir)) {
    const srcBuf = sourceBuffer(file);
    const srcHash = sha256(srcBuf);
    const entry = manifest.files[file.rel];
    const exists = existsSync(file.dest);

    let status;
    if (!exists) {
      status = "installed";
    } else {
      const destHash = sha256(readFileSync(file.dest));
      if (entry && destHash === entry.hash) {
        status = srcHash === destHash ? "unchanged" : "updated";
      } else if (destHash === srcHash) {
        status = "unchanged"; // identical content, adopt into the manifest
      } else {
        status = args.force ? "overwritten" : "conflict";
      }
    }

    if (status !== "conflict") {
      if (!args.dryRun && status !== "unchanged") {
        mkdirSync(dirname(file.dest), { recursive: true });
        writeFileSync(file.dest, srcBuf);
      }
      nextManifest.files[file.rel] = { hash: srcHash, plugin: file.plugin };
    }
    results[status].push(file.rel);
  }

  const block = buildBlock(plugins, version);
  const claudeMdStatus = updateClaudeMd(projectDir, block, args.dryRun);

  // Guard hook for vendored installs: the script goes through the same manifest and conflict rules as every other file; registration never overwrites other hooks.
  let hookStatus = "skipped";
  const core = plugins.find((p) => p.name.endsWith("-core"));
  if (core && !args.noHooks) {
    const guardSrc = join(core.dir, "scripts", "guard-bash.mjs");
    if (existsSync(guardSrc)) {
      const guardRel = join("hooks", "guard-bash.mjs");
      const guardDest = join(claudeDir, guardRel);
      const guardBuf = readFileSync(guardSrc);
      const srcHash = sha256(guardBuf);
      const entry = manifest.files[guardRel];
      let status = "installed";
      if (existsSync(guardDest)) {
        const destHash = sha256(readFileSync(guardDest));
        if (destHash === srcHash) status = "unchanged";
        else if (entry && destHash === entry.hash) status = "updated";
        else status = args.force ? "overwritten" : "conflict";
      }
      if (status !== "conflict") {
        if (!args.dryRun && status !== "unchanged") { mkdirSync(dirname(guardDest), { recursive: true }); writeFileSync(guardDest, guardBuf); }
        nextManifest.files[guardRel] = { hash: srcHash, plugin: core.name };
      }
      results[status].push(guardRel);
      const settingsPath = join(claudeDir, "settings.json");
      const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, "utf8")) : {};
      settings.hooks ??= {}; settings.hooks.PreToolUse ??= [];
      // ${CLAUDE_PROJECT_DIR:-.} keeps the path valid when the variable is unset (older versions, CI shells).
      const cmd = "node \"${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/guard-bash.mjs\"";
      const isOurs = (x) => typeof x.command === "string" && /guard-bash\.mjs/.test(x.command);
      const present = settings.hooks.PreToolUse.some((h) => (h.hooks ?? []).some(isOurs));
      if (!present) {
        settings.hooks.PreToolUse.push({ matcher: "Bash|PowerShell", hooks: [{ type: "command", command: cmd }] });
        if (!args.dryRun) writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
        hookStatus = "registered in .claude/settings.json";
      } else hookStatus = "already registered";
    }
  }

  // Local-only: keep agent files out of the repo's history.
  let localStatus = "not requested";
  if (args.localOnly) {
    const exclude = join(projectDir, ".git", "info", "exclude");
    if (existsSync(dirname(exclude))) {
      const current = existsSync(exclude) ? readFileSync(exclude, "utf8") : "";
      const lines = ["CLAUDE.md", ".claude/", ".cl/", "AI_USAGE.md"].filter((l) => !current.split("\n").includes(l));
      try {
        const tracked = execFileSync("git", ["ls-files", "--", "CLAUDE.md", ".claude", ".cl"], { cwd: projectDir, encoding: "utf8" }).trim();
        if (tracked) console.log(`Local-only: these agent files are already tracked by git and stay tracked until you remove them from the index:\n  ${tracked.split("\n").join("\n  ")}`);
      } catch { /* git not available */ }
      if (lines.length && !args.dryRun) writeFileSync(exclude, `${current}${current && !current.endsWith("\n") ? "\n" : ""}${lines.join("\n")}\n`);
      localStatus = lines.length ? "excluded from git" : "already excluded";
    } else localStatus = "no .git directory found";
  }

  if (!args.dryRun) {
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`);
  }

  const mode = args.dryRun ? "DRY RUN, nothing written" : "written";
  console.log(`Crunchless v${version} -> ${claudeDir} (${mode})`);
  console.log(`Plugins: ${plugins.map((p) => p.name).join(", ")}`);
  console.log(`  installed   ${results.installed.length}`);
  console.log(`  updated     ${results.updated.length}`);
  console.log(`  unchanged   ${results.unchanged.length}`);
  console.log(`  overwritten ${results.overwritten.length}`);
  console.log(`  conflicts   ${results.conflict.length}`);
  console.log(`CLAUDE.md: ${claudeMdStatus}`);
  console.log(`Guard hook: ${hookStatus}`);
  if (args.localOnly) console.log(`Local-only: ${localStatus}`);
  if (results.conflict.length) {
    console.log("\nLeft alone (edited by you, or not installed by the kit). Review, then re-run with --force to overwrite:");
    for (const rel of results.conflict) console.log(`  .claude/${rel}`);
  }
  if (!args.dryRun) {
    console.log(args.localOnly
      ? `\nNext: open Claude Code in ${projectDir} and run /cl-audit. Agent files stay out of git (.git/info/exclude).`
      : `\nNext: commit .claude/ and CLAUDE.md, then open Claude Code in ${projectDir} and run /cl-audit.`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
