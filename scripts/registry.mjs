#!/usr/bin/env node
// Crunchless registry builder.
// Reads every agent, skill, and command across plugins/, validates their frontmatter,
// writes registry.json, and regenerates the roster table inside README.md.
//
// Also writes kit-index.json at the root of cl-core and cl-assistant (see kitIndex below), and the generated member
// table inside every hub skill (`hub: true`) between <!-- hub:start --> and <!-- hub:end --> (see hubBlock below).
//
//   node scripts/registry.mjs          write registry.json, ROSTER.md, TAGS.md, and kit-index.json
//   node scripts/registry.mjs --check  validate only; exit 1 on problems or stale outputs
//
// Node 22+, no dependencies.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const KIT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROSTER_START = "<!-- roster:start -->";
const ROSTER_END = "<!-- roster:end -->";
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_DESCRIPTION = 1024;
const TIERS = ["free", "builder", "studio"]; // members with no tier default to builder
const TIER_LABEL = { builder: "Builder", studio: "Studio" };

const check = process.argv.includes("--check");
const problems = [];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function parseFrontmatter(text, where) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    problems.push(`${where}: missing YAML frontmatter`);
    return {};
  }
  const data = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return data;
}

const SOFT_DESCRIPTION = 300; // Claude Code drops descriptions past a listing budget; short ones survive (round 3, R3-02)
const warnings = [];

function parseList(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value.replace(/^\[|\]$/g, "").split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  }
}

// Extra fields carried into registry.json for routing, help, and SEO.
function extras(fm, where) {
  const tags = parseList(fm.tags);
  for (const t of tags) if (!NAME_RE.test(t)) problems.push(`${where}: tag "${t}" must be lowercase kebab-case`);
  // Plugin mode honors namespaced agents (live test, v0.15 fix pass); a bare name does not resolve inside a plugin.
  if (fm.agent && !/^[a-z0-9-]+:[a-z0-9-]+$/.test(fm.agent)) problems.push(`${where}: agent: "${fm.agent}" must be namespaced, such as cl-core:cl-builder (the installer strips the prefix for vendored copies)`);
  if (fm.context === "fork" && !fm.model && !/^cl-core:/.test(fm.agent ?? "")) problems.push(`${where}: context: fork needs model: or an agent: with the cl-core: prefix`);
  const out = {};
  if (tags.length) out.tags = tags;
  if (fm["harness-surface"]) out.surface = fm["harness-surface"];
  return out;
}

// Listing fields carried into registry.json and kit-index.json. A hidden member (`disable-model-invocation: true`) is
// absent from Claude Code's skill listing and refused by the Skill tool; it is reached through its plugin's hub.
const truthy = (v) => /^(true|yes|on|1)$/i.test(String(v ?? ""));
function listing(fm) {
  const out = {};
  if (truthy(fm.hub)) out.role = "hub";
  if (truthy(fm["disable-model-invocation"])) out.invocable = false;
  return out;
}
const skillFrontmatter = new Map(); // member path -> frontmatter, for the hub tables

function validate(member, where) {
  if (member.description && member.description.length > SOFT_DESCRIPTION) warnings.push(`${where}: description is ${member.description.length} chars (aim for ${SOFT_DESCRIPTION} or fewer)`);
  if (!member.name) problems.push(`${where}: frontmatter needs a name`);
  if (!member.description) problems.push(`${where}: frontmatter needs a description`);
  if (member.name && !NAME_RE.test(member.name)) problems.push(`${where}: name "${member.name}" must be lowercase letters, digits, and single hyphens`);
  if (member.tier === "pro") problems.push(`${where}: tier "pro" is retired; use builder (developing the game) or studio (production, live ops, marketing, docs, and text)`);
  else if (member.tier && !TIERS.includes(member.tier)) problems.push(`${where}: tier must be free, builder, or studio`);
  if (member.description && member.description.length > MAX_DESCRIPTION) {
    problems.push(`${where}: description is ${member.description.length} chars (max ${MAX_DESCRIPTION})`);
  }
}

function collect() {
  const marketplace = readJson(join(KIT_ROOT, ".claude-plugin", "marketplace.json"));
  const members = [];

  for (const plugin of marketplace.plugins) {
    const dir = resolve(KIT_ROOT, plugin.source);
    const manifestPath = join(dir, ".claude-plugin", "plugin.json");
    if (!existsSync(manifestPath)) problems.push(`${plugin.name}: missing .claude-plugin/plugin.json`);
    else if (readJson(manifestPath).name !== plugin.name) problems.push(`${plugin.name}: plugin.json name does not match marketplace entry`);

    const agentsDir = join(dir, "agents");
    if (existsSync(agentsDir)) {
      for (const file of readdirSync(agentsDir).filter((f) => f.endsWith(".md")).sort()) {
        const where = `${plugin.name}/agents/${file}`;
        const fm = parseFrontmatter(readFileSync(join(agentsDir, file), "utf8"), where);
        const member = { type: "agent", plugin: plugin.name, name: fm.name, description: fm.description, tier: fm.tier ?? "builder", path: `plugins/${plugin.name}/agents/${file}`, ...extras(fm, where) };
        validate(member, where);
        if (fm.name && fm.name !== basename(file, ".md")) problems.push(`${where}: name "${fm.name}" must match the file name`);
        members.push(member);
      }
    }

    const skillsDir = join(dir, "skills");
    if (existsSync(skillsDir)) {
      for (const entry of readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
        const skillFile = join(skillsDir, entry.name, "SKILL.md");
        const where = `${plugin.name}/skills/${entry.name}/SKILL.md`;
        if (!existsSync(skillFile)) {
          problems.push(`${where}: missing`);
          continue;
        }
        const fm = parseFrontmatter(readFileSync(skillFile, "utf8"), where);
        const member = { type: "skill", plugin: plugin.name, name: fm.name, description: fm.description, tier: fm.tier ?? "builder", path: `plugins/${plugin.name}/skills/${entry.name}/SKILL.md`, ...extras(fm, where), ...listing(fm) };
        validate(member, where);
        skillFrontmatter.set(member.path, fm);
        if (fm.name && fm.name !== entry.name) problems.push(`${where}: name "${fm.name}" must match the folder name`);
        members.push(member);
      }
    }

    const commandsDir = join(dir, "commands");
    if (existsSync(commandsDir)) {
      for (const file of readdirSync(commandsDir).filter((f) => f.endsWith(".md")).sort()) {
        const where = `${plugin.name}/commands/${file}`;
        const fm = parseFrontmatter(readFileSync(join(commandsDir, file), "utf8"), where);
        const name = basename(file, ".md");
        const member = { type: "command", plugin: plugin.name, name, description: fm.description, tier: fm.tier ?? "builder", path: `plugins/${plugin.name}/commands/${file}`, ...extras(fm, where), ...listing(fm) };
        validate(member, where);
        members.push(member);
      }
    }
  }

  const seen = new Map();
  for (const m of members) {
    if (!m.name) continue;
    const key = `${m.type}:${m.name}`;
    if (seen.has(key)) problems.push(`duplicate ${m.type} name "${m.name}" in ${m.plugin} and ${seen.get(key)}`);
    seen.set(key, m.plugin);
  }
  return { marketplace, members };
}

function plainSentence(text, max = 150) {
  const cut = text.split(/(?<=[.!?])\s/)[0];
  return cut.length <= max ? cut : `${cut.slice(0, max - 1).trimEnd()}…`;
}

function firstSentence(text, max = 150) {
  return plainSentence(text, max).replace(/\|/g, "\\|");
}

// Plugins whose commands read kit-index.json from their own root (${CLAUDE_PLUGIN_ROOT}/kit-index.json).
const INDEX_PLUGINS = ["cl-core", "cl-assistant"];

// kit-index.json: version, tiers, bundles, one line per member, and, in an edition, the members it lacks (upgrades).
// A cached plugin has no kit root, so this is the only index the commands can count on (cold review problem 2).
function kitIndex(members, version) {
  const bundlesPath = join(KIT_ROOT, "bundles.json");
  const upgradePath = join(KIT_ROOT, "upgrade-members.json");
  const upgrade = existsSync(upgradePath) ? readJson(upgradePath) : null;
  const head = {
    version,
    edition: upgrade?.edition ?? "source",
    tiers: { free: "Free", builder: "Builder", studio: "Studio" },
    upgradeUrl: upgrade?.upgradeUrl ?? null,
  };
  const bundles = existsSync(bundlesPath) ? readJson(bundlesPath) : {};
  const row = (m) => {
    const out = { name: m.name, type: m.type, plugin: m.plugin, tier: m.tier };
    if (m.tags?.length) out.tags = m.tags;
    if (m.surface) out.surface = m.surface;
    if (m.role) out.role = m.role;
    if (m.invocable === false) {
      out.invocable = false;
      if (m.hub) out.hub = m.hub;
    }
    out.summary = plainSentence(m.description ?? "");
    return `    ${JSON.stringify(out)}`;
  };
  const ups = (upgrade?.members ?? []).map((m) => row({ ...m, tags: [], surface: null }));
  const open = JSON.stringify(head, null, 2).replace(/\n}$/, ",");
  const bundleRows = Object.entries(bundles).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
  const bundleBlock = `  "bundles": {${bundleRows.length ? `\n${bundleRows.join(",\n")}\n  ` : ""}},`;
  const list = (key, rows, last) => `  "${key}": [${rows.length ? `\n${rows.join(",\n")}\n  ` : ""}]${last ? "" : ","}`;
  return [open, bundleBlock, list("members", members.map(row), false), list("upgrades", ups, true), "}", ""].join("\n");
}

function rosterTable(members, marketplace) {
  const lines = [];
  for (const plugin of marketplace.plugins) {
    const mine = members.filter((m) => m.plugin === plugin.name);
    const counts = { agent: 0, skill: 0, command: 0 };
    for (const m of mine) counts[m.type]++;
    lines.push(`### ${plugin.name}`, "", `${plugin.description}`, "", `${counts.agent} agents, ${counts.skill} skills, ${counts.command} commands`, "");
    lines.push("| Type | Name | What it does |", "| --- | --- | --- |");
    for (const type of ["agent", "skill", "command"]) {
      for (const m of mine.filter((x) => x.type === type)) {
        const display = type === "command" ? `/${m.name}` : m.name;
        lines.push(`| ${type} | [${display}](${m.path})${TIER_LABEL[m.tier] ? ` (${TIER_LABEL[m.tier]})` : ""} | ${firstSentence(m.description ?? "")} |`);
      }
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

// ---- Hubs -----------------------------------------------------------------------------------------
// Claude Code lists every model-invocable skill's description in a budget of about 1% of the context window
// (scripts/token_budget.mjs). Each plugin therefore lists one hub skill (`hub: true`); its other members carry
// `disable-model-invocation: true` and are reached through the hub's generated table. cl-router is cl-core's hub.
const HUB_START = "<!-- hub:start -->";
const HUB_END = "<!-- hub:end -->";
const HUB_DESCRIPTION = 300;
const RANK = { free: 0, builder: 1, studio: 2 };
// Listed skills that are neither free nor a hub: a plain request must reach them with no hub hop. Each one needs a
// reason under "Listed Entry Points" in docs/model-routing.md. Keep this very small.
const LISTED_EXTRAS = [];

function assignHubs(members) {
  const hubs = new Map(); // plugin -> hub member
  for (const m of members.filter((x) => x.type === "skill" && x.role === "hub")) {
    if (hubs.has(m.plugin)) problems.push(`${m.plugin}: two hubs (${hubs.get(m.plugin).name} and ${m.name}); one per plugin`);
    else hubs.set(m.plugin, m);
    if (m.invocable === false) problems.push(`${m.path}: a hub must stay model-invocable`);
    if ((m.description ?? "").length > HUB_DESCRIPTION) problems.push(`${m.path}: hub description is ${m.description.length} chars (max ${HUB_DESCRIPTION})`);
  }
  for (const m of members.filter((x) => x.type === "skill" && x.role !== "hub")) {
    if (m.invocable === false) {
      const hub = hubs.get(m.plugin);
      if (!hub) { problems.push(`${m.path}: hidden, but ${m.plugin} has no hub skill (hub: true)`); continue; }
      m.hub = hub.name;
      if ((RANK[m.tier] ?? RANK.builder) < (RANK[hub.tier] ?? RANK.builder)) problems.push(`${m.path}: tier ${m.tier} is below its hub ${hub.name} (${hub.tier}), so an edition would ship it with no hub`);
    } else if (m.tier !== "free" && !LISTED_EXTRAS.includes(m.name)) {
      problems.push(`${m.path}: listed but neither free nor a hub; add disable-model-invocation: true, or add it to LISTED_EXTRAS with a reason in docs/model-routing.md`);
    }
  }
  for (const name of LISTED_EXTRAS) if (!members.some((m) => m.type === "skill" && m.name === name && m.invocable !== false)) problems.push(`LISTED_EXTRAS names ${name}, which is not a listed skill`);
  return hubs;
}

// How a hub runs a member: inline, or the member's fork agent at the member's model and effort.
function runOf(fm) {
  if (fm?.context !== "fork") return "inline";
  const agent = String(fm.agent ?? "general-purpose").replace(/^cl-core:/, "");
  const pin = [fm.model, fm.effort].filter(Boolean).join(", ");
  return `${agent}${pin ? ` (${pin})` : ""}`;
}

const memberFolder = (m) => m.path.split("/").at(-2);
const hubRel = (m) => `../${memberFolder(m)}/SKILL.md`;
const hubCell = (t) => String(t ?? "").replace(/\s+/g, " ").replace(/\|/g, "\\|");

function hubBlock(hub, members, hubs) {
  const mine = members.filter((m) => m.type === "skill" && m.hub === hub.name).sort((a, b) => a.name.localeCompare(b.name));
  const lines = ["Generated by `node scripts/registry.mjs` from each member's frontmatter. Edit the members, not this block."];
  if (hub.name === "cl-router" && hubs.size > 1) {
    lines.push("", "## Hubs", "", "Each plugin lists one hub skill. Invoke it with the Skill tool (plugin installs: `<plugin>:<hub>`, such as `cl-unity:unity-harness`; vendored installs: the bare name). Its body maps every hidden member to its file and says how to run it. Free members stay listed and are invoked directly.", "", "| Plugin | Hub | Hidden members |", "| --- | --- | --- |");
    for (const [plugin, h] of [...hubs.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      if (h.name === hub.name) continue;
      lines.push(`| ${plugin} | \`${h.name}\` | ${members.filter((m) => m.hub === h.name).length} |`);
    }
  }
  if (hub.name === "cl-router" && mine.length) {
    lines.push("", `## ${hub.plugin} Members`, "", `This skill is the hub for ${hub.plugin}'s hidden members below.`);
  }
  if (mine.length) {
    lines.push(
      "",
      "## How to Run a Member",
      "",
      "1. Pick the one row that fits the request. When two fit, take the narrower one. When none fits, say so and name the closest.",
      `2. Each path is relative to this skill's folder. Read \`\${CLAUDE_SKILL_DIR}/\` plus the path, for example \`\${CLAUDE_SKILL_DIR}/${hubRel(mine[0])}\`.`,
      "3. Never call the Skill tool on a member. Members are hidden from it (`disable-model-invocation: true`), and a refused call ends with Claude Code asking the user to type the command. The user may still type `/<member>` on their own.",
      "4. Run `inline`: follow the member's steps here, and read the `references/` and `scripts/` it names from its own folder.",
      "5. Run `cl-builder` or `cl-scout`: don't follow the member here. Launch that agent with the Agent tool (`cl-core:cl-builder` or `cl-core:cl-scout`, or the bare name where only that is listed) at the model and effort shown. The prompt gives the member's absolute SKILL.md path and everything the user said (files, versions, targets, and decisions), since the agent sees no conversation history. Relay its handoff.",
      "",
      "| Member | Use when | Run | Path |",
      "| --- | --- | --- | --- |",
    );
    for (const m of mine) lines.push(`| \`${m.name}\` | ${hubCell(m.description)} | ${runOf(skillFrontmatter.get(m.path))} | \`${hubRel(m)}\` |`);
  }
  const agents = members.filter((m) => m.type === "agent" && m.plugin === hub.plugin);
  if (agents.length && hub.name !== "cl-router") lines.push("", `Agents in ${hub.plugin}, for work wider than one member: ${agents.map((a) => `\`${a.plugin}:${a.name}\``).join(", ")} (bare names in a vendored install).`);
  return lines.join("\n");
}

// Every hub file with its block regenerated. Returns [{ path, current, next }].
function hubFiles(members, hubs) {
  const out = [];
  for (const hub of hubs.values()) {
    const file = join(KIT_ROOT, hub.path);
    const current = readFileSync(file, "utf8");
    const s = current.indexOf(HUB_START);
    const e = current.indexOf(HUB_END);
    if (s === -1 || e === -1 || e < s) { problems.push(`${hub.path}: missing ${HUB_START} / ${HUB_END} markers`); continue; }
    const eol = current.includes("\r\n") ? "\r\n" : "\n";
    const block = hubBlock(hub, members, hubs).split("\n").join(eol);
    out.push({ path: hub.path, current, next: `${current.slice(0, s + HUB_START.length)}${eol}${block}${eol}${current.slice(e)}` });
  }
  return out;
}

// Reads the tables as written: every row's file exists, and every hidden member sits in exactly one hub table.
function checkHubTables(texts, members) {
  const listedIn = new Map();
  for (const { path, text } of texts) {
    const block = text.slice(text.indexOf(HUB_START), text.indexOf(HUB_END));
    for (const row of block.matchAll(/^\| `([a-z0-9-]+)` \|.*\| `(\.\.\/[^`]+)` \|\r?$/gm)) {
      if (!existsSync(join(KIT_ROOT, dirname(path), row[2]))) problems.push(`${path}: row ${row[1]} points at ${row[2]}, which does not exist`);
      listedIn.set(row[1], [...(listedIn.get(row[1]) ?? []), path]);
    }
  }
  for (const m of members.filter((x) => x.type === "skill" && x.invocable === false)) {
    const n = (listedIn.get(m.name) ?? []).length;
    if (n !== 1) problems.push(`${m.path}: hidden member is in ${n} hub tables (needs exactly 1)`);
  }
  for (const name of listedIn.keys()) {
    const m = members.find((x) => x.type === "skill" && x.name === name);
    if (m && m.invocable !== false) problems.push(`hub row ${name} names a listed skill; hub tables hold hidden members only`);
  }
}

function main() {
  const { marketplace, members } = collect();
  const hubs = assignHubs(members);
  const hubOutputs = hubFiles(members, hubs);
  checkHubTables(hubOutputs.map((h) => ({ path: h.path, text: check ? h.current : h.next })), members);
  const version = readJson(join(KIT_ROOT, "package.json")).version;
  const counts = { agents: 0, skills: 0, commands: 0 };
  for (const m of members) counts[`${m.type}s`]++;
  const tierCounts = Object.fromEntries(TIERS.map((t) => [t, members.filter((m) => m.tier === t).length]));

  const registry = {
    name: marketplace.name,
    version,
    counts: { ...counts, total: members.length, ...tierCounts },
    plugins: marketplace.plugins.map((p) => ({ name: p.name, description: p.description })),
    members: members.map((m) => ({ id: `${m.type}:${m.name}`, ...m })),
  };
  const registryText = `${JSON.stringify(registry, null, 2)}\n`;

  const readmePath = join(KIT_ROOT, "ROSTER.md");
  const readme = existsSync(readmePath) ? readFileSync(readmePath, "utf8") : `# Roster\n\nGenerated by \`node scripts/registry.mjs\` from each member's frontmatter. Do not edit by hand. Builder and Studio members are marked (Builder) and (Studio).\n\n${ROSTER_START}\n${ROSTER_END}\n`;
  const start = readme.indexOf(ROSTER_START);
  const end = readme.indexOf(ROSTER_END);
  if (start === -1 || end === -1 || end < start) {
    problems.push(`ROSTER.md: missing ${ROSTER_START} / ${ROSTER_END} markers`);
  }

  if (problems.length) {
    console.error("Registry problems:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  const summary = `${counts.agents} agents, ${counts.skills} skills, ${counts.commands} commands (${members.length} members: ${tierCounts.free} free, ${tierCounts.builder} builder, and ${tierCounts.studio} studio; ${hubs.size} hubs, ${members.filter((m) => m.type === "skill" && m.invocable !== false).length} listed skills; kit v${version})`;
  const nextReadme = `${readme.slice(0, start + ROSTER_START.length)}\n${summary}\n\n${rosterTable(members, marketplace)}\n${readme.slice(end)}`;
  const registryPath = join(KIT_ROOT, "registry.json");
  const currentRegistry = existsSync(registryPath) ? readFileSync(registryPath, "utf8") : "";
  const tagsPath = join(KIT_ROOT, "TAGS.md");
  const tagsText = tagsIndex(members);
  const currentTags = existsSync(tagsPath) ? readFileSync(tagsPath, "utf8") : "";
  const indexText = kitIndex(members, version);
  const indexPaths = INDEX_PLUGINS.filter((p) => marketplace.plugins.some((x) => x.name === p)).map((p) => `plugins/${p}/kit-index.json`);

  if (warnings.length) {
    console.warn(`Registry warnings (${warnings.length}):`);
    for (const w of warnings.slice(0, 40)) console.warn(`  - ${w}`);
    if (warnings.length > 40) console.warn(`  ... and ${warnings.length - 40} more`);
  }

  if (check) {
    const stale = [];
    if (currentRegistry !== registryText) stale.push("registry.json");
    if (nextReadme !== readme) stale.push("ROSTER.md");
    if (currentTags !== tagsText) stale.push("TAGS.md");
    for (const p of indexPaths) if (!existsSync(join(KIT_ROOT, p)) || readFileSync(join(KIT_ROOT, p), "utf8") !== indexText) stale.push(p);
    for (const h of hubOutputs) if (h.current !== h.next) stale.push(h.path);
    if (stale.length) {
      console.error(`Stale outputs: ${stale.join(", ")}. Run: node scripts/registry.mjs`);
      process.exit(1);
    }
    console.log(`OK: ${summary}`);
    return;
  }

  writeFileSync(registryPath, registryText);
  writeFileSync(readmePath, nextReadme);
  writeFileSync(tagsPath, tagsText);
  for (const p of indexPaths) writeFileSync(join(KIT_ROOT, p), indexText); // built from "\n" joins only, so LF endings
  for (const h of hubOutputs) if (h.current !== h.next) writeFileSync(join(KIT_ROOT, h.path), h.next);
  console.log(`Wrote registry.json, ROSTER.md, TAGS.md, ${hubOutputs.length} hub tables, and ${indexPaths.join(", ")}: ${summary}`);
}

// TAGS.md: every engine, platform, OS, service, and discipline the kit covers, with its members.
// The site's SEO keywords and the help command's topic lookup both read this.
function tagsIndex(members) {
  const byTag = new Map();
  for (const m of members) for (const t of m.tags ?? []) {
    if (!byTag.has(t)) byTag.set(t, []);
    byTag.get(t).push(m.type === "command" ? `/${m.name}` : m.name);
  }
  const lines = ["# Tags", "", "Generated by `node scripts/registry.mjs` from each member's `tags`. Do not edit by hand.", "", `${byTag.size} tags.`, "", "| Tag | Members |", "| --- | --- |"];
  for (const t of [...byTag.keys()].sort()) lines.push(`| ${t} | ${byTag.get(t).sort().join(", ")} |`);
  return `${lines.join("\n")}\n`;
}

main();
