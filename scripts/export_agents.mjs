#!/usr/bin/env node
// Exports the kit for coding agents other than Claude Code, in each agent's own layout.
// The output folder mirrors a project root: copy its contents into the game repository.
//   node scripts/export_agents.mjs --target codex|copilot|cursor|antigravity|gemini|generic [--out <dir>] [--bundle <name>] [--kit <dir>]
// --out defaults to dist/agents/<target>. --kit points at another kit root, such as dist/free.
// Formats follow docs/portability.md (verified 2026-11-15). Node 22+, no dependencies.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const opt = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const TARGETS = ["codex", "copilot", "cursor", "antigravity", "gemini", "generic"];
const TARGET = opt("--target");
if (!TARGETS.includes(TARGET)) {
  console.error(`--target must be one of: ${TARGETS.join(", ")}\nUsage: node scripts/export_agents.mjs --target <agent> [--out <dir>] [--bundle <name>] [--kit <dir>]`);
  process.exit(2);
}
const KIT = resolve(opt("--kit") ?? HERE);
const OUT = resolve(opt("--out") ?? join(HERE, "dist", "agents", TARGET));
const BUNDLE = opt("--bundle");

const KIT_DIR = ".crunchless"; // plugin scripts, primitives, and the member index, in every target

// Where each agent reads skills, agents, and instructions. Sources in docs/portability.md.
const LAYOUT = {
  codex: { skills: ".agents/skills", agents: ".codex/agents", instructions: "AGENTS.md", agentLabel: "OpenAI Codex" },
  copilot: { skills: ".github/skills", agents: ".github/agents", instructions: ".github/copilot-instructions.md", agentLabel: "GitHub Copilot" },
  cursor: { skills: ".cursor/skills", agents: ".cursor/agents", instructions: ".cursor/rules/crunchless.mdc", agentLabel: "Cursor" },
  antigravity: { skills: ".agents/skills", agents: ".agents/agents", instructions: "AGENTS.md", agentLabel: "Antigravity CLI" },
  gemini: { skills: ".gemini/skills", agents: ".gemini/agents", commands: ".gemini/commands", instructions: "GEMINI.md", agentLabel: "Gemini CLI" },
  generic: { skills: ".agents/skills", agents: `${KIT_DIR}/agents`, instructions: "AGENTS.md", agentLabel: "any agent that reads AGENTS.md" },
}[TARGET];

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const posix = (p) => p.split(sep).join("/");
const warnings = [];

// Model and effort per role and target: model-map.json at the kit root (falls back to this repo's copy).
const MODEL_MAP = readJson(existsSync(join(KIT, "model-map.json")) ? join(KIT, "model-map.json") : join(HERE, "model-map.json"));
const TARGET_MAP = MODEL_MAP.targets[TARGET];
function roleOf(fm) {
  const m = String(fm.model ?? "").toLowerCase(), e = String(fm.effort ?? "").toLowerCase();
  if (!m || m === "inherit") return "builder";
  return MODEL_MAP.classify[`${m}:${e}`] ?? MODEL_MAP.classify[m] ?? "builder";
}
function modelText(role) {
  const r = TARGET_MAP[role] ?? {};
  const deep = r.deep ? ` (with --deep: ${r.deep})` : "";
  if (r.model) return `${r.model}${r.reasoning_effort ? `, reasoning effort ${r.reasoning_effort}` : ""}${r.thinkingLevel ? `, thinkingLevel ${r.thinkingLevel}` : ""}${deep}`;
  if (r.picker) return `${r.picker}${deep}`;
  return `your ${r.tier ?? "default"} model`;
}
const roleLine = (fm) => { const role = roleOf(fm); return `Role: ${role}. Suggested model: ${modelText(role)} (see \`${KIT_DIR}/model-map.json\`).\n\n`; };

// Frontmatter: single-line `key: value` pairs, as scripts/registry.mjs reads them.
function split(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fm: {}, body: text };
  const fm = {};
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf(":");
    if (i === -1) continue;
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    fm[line.slice(0, i).trim()] = v;
  }
  return { fm, body: text.slice(m[0].length) };
}
// `["a", "b"]` or `a, b` to an array.
const list = (v) => {
  if (!v) return [];
  try { const j = JSON.parse(v); if (Array.isArray(j)) return j.map(String); } catch {}
  return v.replace(/^\[|\]$/g, "").split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
};
// JSON strings are valid YAML double-quoted scalars and TOML basic strings, so every emitted value is quoted this way.
const q = (s) => JSON.stringify(String(s));

// ---- Select plugins -------------------------------------------------------------------------
const marketplace = readJson(join(KIT, ".claude-plugin", "marketplace.json"));
const version = marketplace.metadata?.version ?? "unknown";
let pluginNames = marketplace.plugins.map((p) => p.name);
if (BUNDLE) {
  const bundles = readJson(join(KIT, "bundles.json"));
  if (!(BUNDLE in bundles)) { console.error(`Unknown bundle "${BUNDLE}". Bundles: ${Object.keys(bundles).join(", ")}`); process.exit(2); }
  if (bundles[BUNDLE]) {
    const picked = new Set(bundles[BUNDLE]);
    picked.add("cl-core");
    pluginNames = pluginNames.filter((n) => picked.has(n));
  }
}
const plugins = marketplace.plugins.filter((p) => pluginNames.includes(p.name));

// ---- Collect members ------------------------------------------------------------------------
const skills = [], agents = [], commands = [];
for (const p of plugins) {
  const src = resolve(KIT, p.source);
  const sd = join(src, "skills");
  if (existsSync(sd)) for (const d of readdirSync(sd, { withFileTypes: true }).filter((x) => x.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = join(sd, d.name, "SKILL.md");
    if (!existsSync(file)) continue;
    skills.push({ plugin: p.name, dir: join(sd, d.name), name: d.name, ...split(readFileSync(file, "utf8")) });
  }
  const ad = join(src, "agents");
  if (existsSync(ad)) for (const f of readdirSync(ad).filter((x) => x.endsWith(".md")).sort()) agents.push({ plugin: p.name, name: basename(f, ".md"), ...split(readFileSync(join(ad, f), "utf8")) });
  const cd = join(src, "commands");
  if (existsSync(cd)) for (const f of readdirSync(cd).filter((x) => x.endsWith(".md")).sort()) commands.push({ plugin: p.name, name: basename(f, ".md"), ...split(readFileSync(join(cd, f), "utf8")) });
}
const skillNames = new Set(skills.map((s) => s.name));
const isTrue = (v) => /^(true|yes|on|1)$/i.test(v ?? "");
// Targets with no flag that keeps a skill out of the listing get hub members outside the skills folder, opened by path,
// so the agent lists only hubs, free skills, and commands. Cursor and Codex hide members natively and keep them in place.
const MEMBERS_DIR = `${KIT_DIR}/members`;
const moved = new Set(["antigravity", "copilot", "gemini", "generic"].includes(TARGET)
  ? skills.filter((s) => isTrue(s.fm["disable-model-invocation"]) && !isTrue(s.fm.hub)).map((s) => s.name) : []);
const pathOf = (n) => (moved.has(n) ? `${MEMBERS_DIR}/${n}` : `${LAYOUT.skills}/${n}`);
const memberNames = new Set([...skillNames, ...agents.map((a) => a.name), ...commands.map((c) => c.name)]);
// A command becomes a skill where the agent has no command format; rename only on a clash.
for (const c of commands) c.skillName = skillNames.has(c.name) ? `${c.name}-command` : c.name;

// ---- Body rewrites (Claude-only syntax) -----------------------------------------------------
// Claude Code hides members from its Skill tool; other agents open them by path. Specific sentences first, the generic path last.
const PORTABLE = [
  [/Skills: this plugin's skills are hidden from the Skill tool, so never call it on them\. /g, "Skills: "],
  [/Never call the Skill tool on a member\. Members are hidden from it \(`disable-model-invocation: true`\), and a refused call ends with Claude Code asking the user to type the command\. The user may still type `\/<member>` on their own\./g, "Open a member by its path in the table below and follow its SKILL.md. Members aren't meant to run on their own."],
  [/Its member skills are hidden from the Skill tool so the skill listing fits its budget\./g, "Its member skills are opened by the paths below, which keeps the skill list short."],
  [/\(it is hidden from the Skill tool; a vendored install can Read (`[^`]+`)\)/g, "(read $1)"],
  [/Most skills named here are hidden from the Skill tool\. /g, ""],
  [/ Never call the Skill tool on a hidden member, and never ask the user to type it\./g, ""],
  [/ Never call the Skill tool on a hidden member, even when a skill, agent, or table names it: Claude Code refuses the call and asks the user to type the command\. Invoke the member's hub instead, or Read the member's SKILL\.md when you already have its path \(vendored installs: (`[^`]+`)\)\. Users can still type `\/<member>` themselves\./g, " Open the member's hub, or read the member's SKILL.md when you already have its path ($1)."],
  [/ These skills are hidden from the Skill tool, so read the files\./g, ""],
  [/ The skill is hidden from the Skill tool, so read the file\./g, ""],
  [/Invoke it with the Skill tool \([^)]*\)\./g, "Open its SKILL.md."],
  [/, (?:which is|since both are) hidden from the Skill tool\./g, "."],
  [/Every skill below is hidden from the Skill tool: read/g, "Read"],
  [/ \(hidden members are never called with the Skill tool; the hub gives the path\)/g, " (the hub gives the path)"],
  [/; most kit skills are hidden from the Skill tool, so never call that tool on them\./g, "."],
  [/, then search the plugin cache \(`~\/\.claude\/plugins\/`\) for `skills\/<name>\/SKILL\.md`; if neither exists,/g, "; if it doesn't exist,"],
  [/; never call the Skill tool on it\./g, "."],
  [/ are hidden from the Skill tool so the skill list stays short\./g, " are opened by path so the skill list stays short."],
  [/ Never call the Skill tool on a hidden skill\./g, ""],
  [/, never through the Skill tool/g, ""],
  [/Launch that agent with the Agent tool \([^)]*\) at the model and effort shown\./g, `Hand the task to that agent with your tool's subagent feature, at its role's model in \`${KIT_DIR}/model-map.json\`.`],
  [/with the Agent tool's `effort: high`/g, `at its role's --deep setting in \`${KIT_DIR}/model-map.json\``],
  [/\b(scout|builder|analyst|specialist) (?:haiku|sonnet|opus)\b/g, "$1 model"],
  // Install and update steps: the export command first, Claude Code's /plugin flow kept as the other path.
  [/ Codex, GitHub Copilot, Cursor, Antigravity, or another agent: from a clone of the kit, `[^`]+`\./g, ""],
  [/the install command for each path: `\/plugin install <plugin>@<marketplace>`, or, from a clone of the kit, `node scripts\/install\.mjs --project \. --bundle <name>`\./g,
    `the command that adds it here, run from a clone of the kit: \`node scripts/export_agents.mjs --target ${TARGET} --bundle <name> --out .\`.`],
  [/\*\*How do I install\?\*\* In Claude Code:/g, `**How do I install?** For ${LAYOUT.agentLabel}: from a clone of the kit, \`node scripts/export_agents.mjs --target ${TARGET} --bundle <name> --out <repo>\` writes the skills, agents, and instructions in its own layout. In Claude Code:`],
  [/Each path is relative to this skill's folder\. Read `[^`]+` plus the path, for example (`[^`]+`)\./g, "Each path is from the project root, for example $1."],
];
// Claude model names in prose become the role they stand for (model-map.json classify); `model:` frontmatter in templates and URLs stay.
const CLAUDE_MODEL = /(?<!model: )(?<![\w/.-])(haiku|sonnet|opus)(?:(?:,? (?:effort )?| at )(low|medium|high))?(?![\w-]| \d)/g;
const roleWord = (_, m, e) => `${MODEL_MAP.classify[`${m}:${e}`] ?? MODEL_MAP.classify[m] ?? "builder"} model`;
const portable = (text) => PORTABLE.reduce((t, [re, to]) => t.replace(re, to), text).replaceAll(".claude/skills/<name>/", `${LAYOUT.skills}/<name>/`).replace(CLAUDE_MODEL, roleWord);
let skillToolLeft = 0;
const argsText = TARGET === "gemini" ? "{{args}}" : "the text the user typed with the command";
function rewrite(text, plugin, skill = null) {
  return text
    .replace(/(?:\$\{CLAUDE_SKILL_DIR\}\/)?\.\.\/([a-z0-9-]+)\//g, (m, n) => (skillNames.has(n) ? `${pathOf(n)}/` : m)) // hub rows: from the project root
    .replaceAll("${CLAUDE_SKILL_DIR}", skill ? `${LAYOUT.skills}/${skill}` : LAYOUT.skills) // a hub's member paths are relative to its folder
    .replaceAll("${CLAUDE_PLUGIN_ROOT}/../..", KIT_DIR) // the kit root: registry.json, TAGS.md, bundles.json
    .replace(/\$\{CLAUDE_PLUGIN_ROOT\}\/skills\//g, `${LAYOUT.skills}/`)
    .replace(/(?<![\w.])\.\.\/\.\.\/(primitives\.json|mcp\.example\.json|kit-index\.json|scripts\/|references\/|hooks\/)/g, `${KIT_DIR}/plugins/${plugin}/$1`)
    .replaceAll("${CLAUDE_PLUGIN_ROOT}", `${KIT_DIR}/plugins/${plugin}`)
    .replace(/<(?:path-to-)?(cl-[a-z0-9-]+)>/g, (_, p) => `${KIT_DIR}/plugins/${p}`)
    .replace(/\bplugins\/(cl-[a-z0-9-]+)\/skills\/([a-z0-9-]+)\//g, (m, _p, n) => (skillNames.has(n) ? `${pathOf(n)}/` : m))
    .replace(/(?<![\w./-])plugins\/(cl-[a-z0-9-]+)\/(scripts\/|references\/|primitives\.json|mcp\.example\.json)/g, (_, p, rest) => `${KIT_DIR}/plugins/${p}/${rest}`)
    .replace(/\.claude\/skills\/([a-z0-9-]+)\//g, (m, n) => (skillNames.has(n) ? `${pathOf(n)}/` : m))
    .replace(/\/?\b(cl-[a-z0-9-]+):([a-z0-9-]+)\b/g, (m, _p, n) => (memberNames.has(n) ? n : m))
    .replaceAll("$ARGUMENTS", argsText)
    ;
}
const SKILLS_PATH = new RegExp(`${LAYOUT.skills.replace(/[.]/g, "\\.")}/([a-z0-9-]+)/`, "g");
const relocate = (t) => (moved.size
  ? t.replace(SKILLS_PATH, (m, n) => (moved.has(n) ? `${MEMBERS_DIR}/${n}/` : m))
    .replaceAll(`\`${LAYOUT.skills}/<name>/SKILL.md\``, `\`${LAYOUT.skills}/<name>/SKILL.md\` (hub members: \`${MEMBERS_DIR}/<name>/SKILL.md\`)`)
  : t);
const rewriteOut = (text, plugin, skill) => { const t = relocate(portable(rewrite(text, plugin, skill))); skillToolLeft += (t.match(/Skill tool|Agent tool/g) ?? []).length; return t; };

// ---- Writers --------------------------------------------------------------------------------
// Wipe only a subfolder of this repo's dist/; on Windows another drive gives an absolute relative path.
const distRel = relative(join(HERE, "dist"), OUT);
const insideDist = distRel !== "" && !distRel.startsWith("..") && !isAbsolute(distRel);
if (insideDist && existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
else if (existsSync(OUT)) console.log(`Writing into existing ${OUT}: files are overwritten, nothing is deleted.`);
const write = (rel, content) => { const p = join(OUT, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, content); return rel; };

function skillFrontmatter({ name, fm, plugin }, extra = {}) {
  const lines = ["---", `name: ${name}`, `description: ${q(fm.description ?? "")}`];
  if (fm.license) lines.push(`license: ${q(fm.license)}`);
  if (TARGET === "cursor" && fm.paths) lines.push(`paths: ${JSON.stringify(list(fm.paths))}`);
  for (const [k, v] of Object.entries(extra)) lines.push(`${k}: ${v}`);
  // Agent Skills spec: metadata is a string-to-string map; kit fields live there.
  lines.push("metadata:", `  crunchless-plugin: ${q(plugin)}`, `  crunchless-tier: ${q(fm.tier ?? "builder")}`);
  if (fm.model) lines.push(`  crunchless-role: ${q(roleOf(fm))}`);
  if (fm.tags) lines.push(`  crunchless-tags: ${q(list(fm.tags).join(", "))}`);
  if (fm["harness-surface"]) lines.push(`  crunchless-harness-surface: ${q(fm["harness-surface"])}`);
  lines.push("---", "");
  return lines.join("\n");
}

const written = { skills: 0, commands: 0, agents: 0 };
const indexRows = [];

for (const s of skills) {
  const dest = join(OUT, pathOf(s.name));
  cpSync(s.dir, dest, { recursive: true, filter: (p) => !posix(relative(s.dir, p)).startsWith("evals") });
  // Rewrite every Markdown file in the skill, then replace SKILL.md's frontmatter.
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith(".md") && e.name !== "SKILL.md") writeFileSync(p, rewriteOut(readFileSync(p, "utf8"), s.plugin, s.name)); } };
  walk(dest);
  // A hidden member (disable-model-invocation: true) stays a file that its plugin's hub reads by path. Cursor honors the
  // same field, and Codex's openai.yaml policy keeps it out of implicit use; other agents list it.
  const hidden = /^(true|yes|on|1)$/i.test(s.fm["disable-model-invocation"] ?? "");
  writeFileSync(join(dest, "SKILL.md"), skillFrontmatter(s, hidden && TARGET === "cursor" ? { "disable-model-invocation": "true" } : {}) + rewriteOut(s.body, s.plugin, s.name));
  if (hidden && TARGET === "codex") write(`${LAYOUT.skills}/${s.name}/agents/openai.yaml`, "policy:\n  allow_implicit_invocation: false\n");
  if (s.fm.description && s.fm.description.length > 1024) warnings.push(`${s.name}: description over the 1024-character spec limit`);
  indexRows.push({ plugin: s.plugin, type: /^(true|yes|on|1)$/i.test(s.fm.hub ?? "") ? "hub" : "skill", name: s.name, description: s.fm.description, path: `${pathOf(s.name)}/SKILL.md`, hidden });
  written.skills++;
}

for (const c of commands) {
  const hint = c.fm["argument-hint"] ? `Input: ${c.fm["argument-hint"]}\n\n` : "";
  if (TARGET === "gemini") {
    const rel = write(`${LAYOUT.commands}/${c.name}.toml`, `description = ${q(c.fm.description ?? "")}\nprompt = ${q(`${hint}${rewriteOut(c.body, c.plugin).trimStart()}`)}\n`);
    indexRows.push({ plugin: c.plugin, type: "command", name: `/${c.name}`, description: c.fm.description, path: rel });
  } else {
    const desc = `${(c.fm.description ?? "").replace(/\.$/, "")}. Run only when the user asks for /${c.name} by name.`;
    const extra = TARGET === "cursor" ? { "disable-model-invocation": "true" } : {};
    const dir = `${LAYOUT.skills}/${c.skillName}`;
    write(`${dir}/SKILL.md`, skillFrontmatter({ name: c.skillName, fm: { ...c.fm, description: desc }, plugin: c.plugin }, extra) + `# /${c.name}\n\n${hint}${rewriteOut(c.body, c.plugin).trimStart()}`);
    // Codex: agents/openai.yaml policy keeps a command from running unless named.
    if (TARGET === "codex") write(`${dir}/agents/openai.yaml`, "policy:\n  allow_implicit_invocation: false\n");
    indexRows.push({ plugin: c.plugin, type: "command", name: `/${c.name}`, description: c.fm.description, path: `${dir}/SKILL.md` });
  }
  written.commands++;
}

const READ_ONLY = "Read-only role: do not edit files or run commands that change state. Report what you find.\n\n";
for (const a of agents) {
  const tools = list(a.fm.tools);
  const readOnly = tools.length > 0 && !tools.some((t) => /^(Write|Edit|MultiEdit|NotebookEdit)$/.test(t));
  const shell = tools.includes("Bash");
  const body = roleLine(a.fm) + (readOnly ? READ_ONLY : "") + rewriteOut(a.body, a.plugin).trim() + "\n";
  const desc = a.fm.description ?? "";
  let rel;
  if (TARGET === "codex") {
    const r = TARGET_MAP[roleOf(a.fm)] ?? {};
    const model = r.model ? `model = ${q(r.model)}\n` : "";
    const effort = r.reasoning_effort ? `model_reasoning_effort = ${q(r.reasoning_effort)}\n` : "";
    rel = write(`${LAYOUT.agents}/${a.name}.toml`, `name = ${q(a.name)}\ndescription = ${q(desc)}\n${model}${effort}developer_instructions = ${q(body)}\n`);
  } else if (TARGET === "copilot") {
    // Only the aliases the custom agents doc shows (read, search). A role that needs a shell keeps all tools and the read-only line.
    const t = readOnly && !shell ? `tools: ["read", "search"]\n` : "";
    if (body.length > 30000) warnings.push(`${a.name}: prompt over Copilot's 30,000-character limit`);
    rel = write(`${LAYOUT.agents}/${a.name}.agent.md`, `---\nname: ${a.name}\ndescription: ${q(desc)}\n${t}---\n\n${body}`);
  } else if (TARGET === "cursor") {
    rel = write(`${LAYOUT.agents}/${a.name}.md`, `---\nname: ${a.name}\ndescription: ${q(desc)}\nmodel: inherit\n${readOnly ? "readonly: true\n" : ""}---\n\n${body}`);
  } else if (TARGET === "antigravity") {
    // Subagent frontmatter takes a model tier (inherit, flash, pro); a role with no shell turns command execution off.
    const tier = TARGET_MAP[roleOf(a.fm)]?.agentModel ?? "inherit";
    rel = write(`${LAYOUT.agents}/${a.name}.md`, `---\nname: ${a.name}\ndescription: ${q(desc)}\nmodel: ${tier}\n${readOnly && !shell ? "commandExecutionPolicy: off\n" : ""}---\n\n${body}`);
  } else if (TARGET === "gemini") {
    rel = write(`${LAYOUT.agents}/${a.name}.md`, `---\nname: ${a.name}\ndescription: ${q(desc)}\n---\n\n${body}`);
  } else {
    rel = write(`${LAYOUT.agents}/${a.name}.md`, `# Role: ${a.name}\n\n${desc}\n\n${body}`);
  }
  indexRows.push({ plugin: a.plugin, type: "agent", name: a.name, description: desc, path: rel });
  written.agents++;
}

// Kit-root files that cl-help and cl-guide read, limited to the exported plugins.
const exported = new Set(plugins.map((p) => p.name));
if (existsSync(join(KIT, "registry.json"))) {
  const reg = readJson(join(KIT, "registry.json"));
  write(`${KIT_DIR}/registry.json`, JSON.stringify({ ...reg, members: (reg.members ?? []).filter((m) => exported.has(m.plugin)) }, null, 2) + "\n");
}
if (existsSync(join(KIT, "bundles.json"))) {
  const b = readJson(join(KIT, "bundles.json"));
  write(`${KIT_DIR}/bundles.json`, JSON.stringify(Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v ? v.filter((n) => exported.has(n)) : null])), null, 2) + "\n");
}
write(`${KIT_DIR}/model-map.json`, JSON.stringify({ roles: MODEL_MAP.roles, classify: MODEL_MAP.classify, deep: MODEL_MAP.deep, [TARGET]: TARGET_MAP }, null, 2) + "\n");
if (existsSync(join(KIT, "TAGS.md"))) cpSync(join(KIT, "TAGS.md"), join(OUT, KIT_DIR, "TAGS.md"));

// Plugin-level files the skills point at.
for (const p of plugins) {
  const src = resolve(KIT, p.source);
  for (const extra of ["scripts", "references", "hooks", "primitives.json", "mcp.example.json", "kit-index.json"]) if (existsSync(join(src, extra))) cpSync(join(src, extra), join(OUT, KIT_DIR, "plugins", p.name, extra), { recursive: true });
}

// ---- Index and instructions -----------------------------------------------------------------
const cell = (s) => String(s ?? "").replaceAll("|", "\\|");
// Two levels, so an agent without native skills reads one short plugin list, then one plugin's table.
// Counts up front, so an agent asked "how many skills" answers from this file without opening every plugin index.
const count = (rows, type) => rows.filter((r) => r.type === type).length;
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const counts = (rows) => {
  const hubs = count(rows, "hub");
  const parts = [`${plural(count(rows, "skill") + hubs, "skill")}${hubs ? ` (${plural(hubs, "hub")} among them)` : ""}`];
  for (const type of ["command", "agent"]) if (count(rows, type)) parts.push(plural(count(rows, type), type));
  return parts.length < 3 ? parts.join(" and ") : `${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`;
};
const commandsAsSkills = TARGET !== "gemini" && written.commands > 0;
const index = [`# Crunchless Member Index`, "", `Kit version ${version}, exported for ${LAYOUT.agentLabel}. Pick the plugin that fits the task, open its index, then read only the member file you need.`, "",
  `This export holds ${counts(indexRows)}. \`${LAYOUT.skills}/\` holds ${written.skills - moved.size + (commandsAsSkills ? written.commands : 0)} folders${commandsAsSkills ? ", commands included" : ""}${moved.size ? `; the other ${moved.size} skills are hub members in \`${MEMBERS_DIR}/\`, opened by the path their hub gives` : ""}.`, "",
  "| Plugin | Covers | Members | Index |", "|---|---|---|---|"];
for (const p of plugins) {
  const rows = indexRows.filter((r) => r.plugin === p.name).sort((a, b) => (b.type === "hub") - (a.type === "hub"));
  const hub = rows.find((r) => r.type === "hub");
  if (!rows.length) continue;
  const rel = `${KIT_DIR}/index/${p.name}.md`;
  index.push(`| ${p.name} | ${cell(p.description)}${hub ? ` Hub: \`${hub.name}\`.` : ""} | ${counts(rows)} | \`${rel}\` |`);
  const t = [`# ${p.name}`, "", p.description, "", "| Type | Name | Use | File |", "|---|---|---|---|"];
  if (hub) t.splice(4, 0, `Start with the hub, \`${hub.name}\`: it maps every member below to its file and says how to run it. Members marked "through the hub" are not offered on their own.`, "");
  for (const r of rows) t.push(`| ${r.type} | \`${r.name}\` | ${cell(r.description)}${r.hidden && hub ? ` (through the hub \`${hub.name}\`)` : ""} | \`${r.path}\` |`);
  write(rel, t.join("\n") + "\n");
}
write(`${KIT_DIR}/INDEX.md`, index.join("\n") + "\n");

const routerPath = skillNames.has("cl-router") ? `${LAYOUT.skills}/cl-router/SKILL.md` : `${KIT_DIR}/INDEX.md`;
const commandLine = {
  codex: `Each kit command is a skill in \`${LAYOUT.skills}/\` that runs only when named. Type \`$cl-audit\`, or pick it from \`/skills\`.`,
  copilot: `Each kit command is a skill in \`${LAYOUT.skills}/\`. Ask for it by name, such as "run cl-audit".`,
  cursor: `Each kit command is a skill in \`${LAYOUT.skills}/\` that runs only when named. Type \`/cl-audit\` in Agent chat.`,
  antigravity: `Each kit command is a skill in \`${LAYOUT.skills}/\`, and every skill is a slash command. Type \`/cl-audit\`, and run \`/skills reload\` after changing skills.`,
  gemini: `Kit commands are in \`${LAYOUT.commands}/\`. Type \`/cl-audit\`, and run \`/commands reload\` after changing them.`,
  generic: `Kit commands are skills in \`${LAYOUT.skills}/\`. When the user names one, such as "cl-audit", read its SKILL.md and follow it.`,
}[TARGET];
const agentLine = TARGET === "generic"
  ? `Specialist roles are briefs in \`${LAYOUT.agents}/\`. When a step says to launch one, such as \`cl-scout\`, use your own subagent feature with that brief if you have one; otherwise do the step yourself.`
  : `Specialist roles are custom agents in \`${LAYOUT.agents}/\`. When a step says to launch one, such as \`cl-scout\`, delegate to that agent by name.`;
const coreBlock = existsSync(join(KIT, "plugins", "cl-core", "claude-md-block.md")) ? readFileSync(join(KIT, "plugins", "cl-core", "claude-md-block.md"), "utf8") : "";
const sharedRules = coreBlock.split(/\r?\n/).filter((l) => /^- Rules that apply everywhere/.test(l)).map((l) => l.replace(/^- Rules that apply everywhere: (.)/, (_, c) => `- ${c.toUpperCase()}`));
const instructions = [
  "# Crunchless Game Dev Kit",
  "",
  `This project carries the Crunchless game dev kit, version ${version}, exported for ${LAYOUT.agentLabel}. It holds skills (step-by-step procedures), specialist agents, and commands for building, auditing, and shipping games.`,
  "",
  "## How to Use the Kit",
  "",
  `1. At the start of any game-development task, read \`${routerPath}\`. It maps tasks to members and holds the shared rules.`,
  `2. Skills live in \`${LAYOUT.skills}/\`. If one isn't offered automatically, find it in \`${KIT_DIR}/INDEX.md\` and read its SKILL.md.${moved.size ? ` Hub members sit in \`${MEMBERS_DIR}/\`, outside the skill list, and are opened by the path their hub gives.` : ""} Don't load skills the task doesn't need.`,
  `3. ${commandLine}`,
  `4. ${agentLine}`,
  `5. Run scripts with Node 22 or newer from the project root. A skill's scripts sit in its own \`scripts/\` folder, and plugin scripts sit in \`${KIT_DIR}/plugins/<plugin>/scripts/\`.`,
  `6. Pick the model by role (\`${KIT_DIR}/model-map.json\`): scout, ${modelText("scout")}; builder, ${modelText("builder")}; analyst, ${modelText("analyst")}; specialist, ${modelText("specialist")}. Each agent file names its role, and skills say "scout model", "builder model", "analyst model", or "specialist model" for the same choices. High effort is opt-in with --deep. Hooks and \`/plugin\` steps are Claude Code only; skip them.`,
  "7. Every finished piece of work ends with the Crunchless handoff block the skill describes.",
  ...(sharedRules.length ? ["", "## Rules That Apply Everywhere", "", ...sharedRules] : []),
  "",
];
const instructionText = TARGET === "cursor"
  ? `---\ndescription: ${q("Crunchless game dev kit: how to find and run its skills, agents, and commands.")}\nalwaysApply: true\n---\n\n${instructions.join("\n")}`
  : instructions.join("\n");
write(LAYOUT.instructions, instructionText);
if (Buffer.byteLength(instructionText) > 32 * 1024) warnings.push(`${LAYOUT.instructions} is over Codex's 32 KiB default project_doc_max_bytes`);

write(`${KIT_DIR}/README.md`, `# Crunchless Export\n\nKit version ${version}, target ${TARGET}${BUNDLE ? `, bundle ${BUNDLE}` : ""}. Copy everything in this folder into your game repository's root. Rerun scripts/export_agents.mjs to update.\n\nPlugins: ${plugins.map((p) => p.name).join(", ")}.\n`);

if (skillToolLeft) warnings.push(`${skillToolLeft} mentions of Claude Code's Skill or Agent tool survived the rewrite; add a PORTABLE rule`);
for (const w of warnings) console.warn(`warning: ${w}`);
console.log(`${TARGET}: ${written.skills} skills, ${written.commands} commands, ${written.agents} agents from ${plugins.length} plugins written to ${OUT}`);
