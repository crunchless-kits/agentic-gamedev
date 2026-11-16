// Reads one run's stream-json log and reports what the run did, for the verification checks and the report.
//   node verify-log.mjs <run.jsonl>
import { readFileSync } from "node:fs";

const lines = readFileSync(process.argv[2], "utf8").trim().split("\n").map((l) => { try { return JSON.parse(l); } catch { return {}; } });
const result = lines.findLast((e) => e.type === "result") || {};
const tools = {};
const pokiLookups = [];
for (const e of lines) {
  if (e.type !== "assistant") continue;
  for (const c of e.message?.content || []) {
    if (c.type !== "tool_use") continue;
    const name = c.name === "Skill" ? `Skill:${c.input?.skill}` : c.name === "Agent" || c.name === "Task" ? `Agent:${c.input?.subagent_type || ""}` : c.name;
    tools[name] = (tools[name] || 0) + 1;
    const target = c.name === "WebFetch" ? c.input?.url : c.name === "WebSearch" ? c.input?.query : null;
    if (target && /poki/i.test(String(target))) pokiLookups.push(String(target).slice(0, 120));
  }
}
let raw = 0;
for (const u of Object.values(result.modelUsage || {})) raw += u.inputTokens + u.outputTokens + u.cacheReadInputTokens + u.cacheCreationInputTokens;
console.log(JSON.stringify({
  ok: result.subtype === "success",
  c25_checked_live_docs: pokiLookups.some((u) => /poki\.com/i.test(u)) ? "pass" : "fail",
  pokiLookups: [...new Set(pokiLookups)],
  tools, rawTokens: raw, seconds: Math.round((result.duration_ms || 0) / 100) / 10, turns: result.num_turns,
  models: Object.keys(result.modelUsage || {}), costUsd: result.total_cost_usd,
  finalMessage: result.result || "",
}));
