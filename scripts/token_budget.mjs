#!/usr/bin/env node
// Role: reference. Measures the skill-listing load of each install bundle against Claude Code's listing budget.
//
// Claude Code lists every skill and command name with its description (plus `when_to_use`) in a budget of 1% of the
// model's context window (https://code.claude.com/docs/en/skills, "Skill descriptions are cut short"). Members with
// `disable-model-invocation: true` list no description, so they cost nothing here: each plugin lists one hub skill
// (`hub: true`) that reaches its hidden members (scripts/registry.mjs). scripts/smoke.mjs fails when any bundle but
// "everything" is over budget; "everything" is reported separately and never gated. 1% of a 200K-token window is
// 2,000 tokens; at about 4 characters per token that is roughly 8,000 characters. Both numbers are estimates.
//
// Usage: node scripts/token_budget.mjs [--json] [--bundle <name>]

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTEXT_TOKENS = 200_000;
const BUDGET_TOKENS = CONTEXT_TOKENS * 0.01;
const CHARS_PER_TOKEN = 4;
const BUDGET_CHARS = BUDGET_TOKENS * CHARS_PER_TOKEN;

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const only = args.includes("--bundle") ? args[args.indexOf("--bundle") + 1] : null;

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

function pluginMembers(plugin) {
  const dir = join(KIT, "plugins", plugin);
  const members = [];
  const skillsDir = join(dir, "skills");
  if (existsSync(skillsDir)) {
    for (const s of readdirSync(skillsDir)) {
      const f = join(skillsDir, s, "SKILL.md");
      if (existsSync(f)) members.push({ kind: "skill", name: s, fm: frontmatter(readFileSync(f, "utf8")) });
    }
  }
  const cmdDir = join(dir, "commands");
  if (existsSync(cmdDir)) {
    for (const c of readdirSync(cmdDir).filter((x) => x.endsWith(".md"))) {
      members.push({ kind: "command", name: c.replace(/\.md$/, ""), fm: frontmatter(readFileSync(join(cmdDir, c), "utf8")) });
    }
  }
  return members;
}

const truthy = (v) => /^(true|yes|on|1)$/i.test(v ?? "");
const bundles = JSON.parse(readFileSync(join(KIT, "bundles.json"), "utf8"));
const allPlugins = readdirSync(join(KIT, "plugins")).filter((p) => existsSync(join(KIT, "plugins", p, ".claude-plugin")) || existsSync(join(KIT, "plugins", p, "skills")));
const sets = { ...bundles, everything: allPlugins };

const rows = [];
for (const [bundle, plugins] of Object.entries(sets)) {
  if (only && bundle !== only) continue;
  const list = Array.isArray(plugins) ? plugins : allPlugins;
  // Every plugin installs with the core (scripts/install.mjs CORE_FOR_ALL).
  const withCore = [...new Set(["cl-core", ...list])];
  const members = withCore.flatMap(pluginMembers);
  const listed = members.filter((m) => !truthy(m.fm["disable-model-invocation"]));
  const chars = listed.reduce((a, m) => a + (m.fm.description ?? "").length + (m.fm.when_to_use ?? "").length, 0);
  const tokens = Math.ceil(chars / CHARS_PER_TOKEN);
  rows.push({
    bundle,
    plugins: withCore.length,
    members: members.length,
    nameOnly: members.length - listed.length,
    listed: listed.length,
    hubs: listed.filter((m) => truthy(m.fm.hub)).length,
    gated: bundle !== "everything",
    descriptionChars: chars,
    avgChars: listed.length ? Math.round(chars / listed.length) : 0,
    estTokens: tokens,
    budgetTokens: BUDGET_TOKENS,
    fits: tokens <= BUDGET_TOKENS,
  });
}

if (asJson) {
  console.log(JSON.stringify({ contextTokens: CONTEXT_TOKENS, budgetTokens: BUDGET_TOKENS, budgetChars: BUDGET_CHARS, estimate: true, rows }, null, 2));
} else {
  console.log(`Listing budget: 1% of ${CONTEXT_TOKENS.toLocaleString("en-US")} tokens = ${BUDGET_TOKENS} tokens (about ${BUDGET_CHARS} characters). Estimate: characters / ${CHARS_PER_TOKEN}.`);
  console.log("bundle".padEnd(14), "members".padStart(7), "hidden".padStart(6), "listed".padStart(6), "hubs".padStart(4), "desc chars".padStart(10), "avg".padStart(5), "est tokens".padStart(10), " fits");
  const line = (r) => console.log(r.bundle.padEnd(14), String(r.members).padStart(7), String(r.nameOnly).padStart(6), String(r.listed).padStart(6), String(r.hubs).padStart(4), String(r.descriptionChars).padStart(10), String(r.avgChars).padStart(5), String(r.estTokens).padStart(10), r.fits ? ` yes (${Math.round((r.estTokens / BUDGET_TOKENS) * 100)}%)` : ` no (${(r.estTokens / BUDGET_TOKENS).toFixed(1)}x)`);
  rows.filter((r) => r.gated).forEach(line);
  const all = rows.filter((r) => !r.gated);
  if (all.length) { console.log("Reported separately, not gated (every plugin at once):"); all.forEach(line); }
}
