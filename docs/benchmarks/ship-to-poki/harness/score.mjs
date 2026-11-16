// Scores one game folder against the scripted checks in RUBRIC.md.
//   node score.mjs <gameDir> [--json out.json]
// Each check is "pass", "fail", or "unknown" (the harness could not observe it; a judge decides).
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { frameDiff } from "./env.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const gameDir = process.argv[2];
const outIdx = process.argv.indexOf("--json");
const SCENARIOS = ["normal", "adblock", "nosdk", "nofetch", "nostorage", "corrupt", "audioblocked", "fps60", "fps144"];

const obs = {};
for (const s of SCENARIOS) {
  const r = spawnSync(process.execPath, [join(here, "run-scenario.mjs"), gameDir, s], { encoding: "utf8", timeout: 120000 });
  const line = (r.stdout || "").trim().split("\n").filter((l) => l.startsWith("{")).pop();
  try { obs[s] = JSON.parse(line); } catch { obs[s] = { scenario: s, fatal: `no result (exit ${r.status}, ${String(r.stderr || "").slice(0, 200)})` }; }
}

const playable = (o) => !!(o && o.loaded && !o.fatal && o.respond && o.respond.alive && o.respond.moved >= 15);
const N = obs.normal || {};
const P = (b) => (b ? "pass" : "fail");
const checks = {};
checks.c01_boots_normal = P(playable(N));
checks.c02_boots_adblock = P(playable(obs.adblock));
checks.c03_boots_no_sdk = P(playable(obs.nosdk));
checks.c04_boots_request_blocked = P(playable(obs.nofetch));
checks.c05_boots_no_storage = P(playable(obs.nostorage));
checks.c06_boots_corrupt_save = P(playable(obs.corrupt));
const ran = playable(N);
checks.c07_loading_finished = P(ran && N.loadingFinished >= 1);
checks.c08_start_on_first_input = P(ran && !N.gameplayStartBeforeInput && N.gameplayStartAfterInput >= 1);
const later = N.laterDeaths || [];
checks.c09_stop_on_death = P(ran && N.death && N.death.stopLogged && later.length === 2 && later.every((d) => d.stopLogged));
// Each restart must read: commercialBreak first, no gameplayStart until the last break ends, then gameplayStart.
const okCycle = (seq) => { const first = seq.indexOf("commercialBreak"), lastEnd = seq.lastIndexOf("commercialBreak:end"); return first >= 0 && lastEnd > first && !seq.slice(0, lastEnd).includes("gameplayStart") && seq.slice(lastEnd + 1).includes("gameplayStart"); };
checks.c10_break_on_restart = P(ran && (N.restartSeqs || []).length === 3 && N.restartSeqs.every(okCycle));
checks.c11_audio_muted_in_break = P(ran && N.breakPending >= 1 && N.audibleDuringBreak === false);
checks.c12_input_held_in_break = P(ran && N.breakPending >= 1 && N.extraBreaksDuringBreak === 0 && N.startsDuringBreak === 0);
checks.c13_prevent_default = P(ran && N.prevented && N.prevented.ArrowUp && N.prevented.ArrowDown && N.prevented[" "]);
checks.c16_no_frame_logging = P(ran && N.consolePerSecond <= 3);
const a = obs.fps60, b = obs.fps144;
if (playable(a) && playable(b)) {
  const d = frameDiff(a.respond.frame, b.respond.frame);
  checks.c19_frame_rate_independent = d.compared === 0 || !d.sameShape ? "unknown" : P(d.max <= 12);
  obs.fpsDiff = d;
} else checks.c19_frame_rate_independent = "fail";
checks.c20_pause_on_hidden = !ran ? "fail" : !N.hiddenJump || N.hiddenJump.compared === 0 ? "unknown" : P(N.audibleWhileHidden === false && N.hiddenJump.max <= 250);
checks.c21_no_listener_stacking = P(ran && N.listenersAfterThreeRestarts <= N.listenersAfterFirstRun);
checks.c22_music_after_gesture = P(ran && N.musicBeforeInput === 0 && obs.audioblocked && obs.audioblocked.unhandled === 0 && playable(obs.audioblocked));
if ([N, obs.audioblocked].some((o) => o && (o.envNotes || []).includes("uses Web Audio"))) for (const k of ["c11_audio_muted_in_break", "c20_pause_on_hidden", "c22_music_after_gesture"]) if (checks[k] === "fail") checks[k] = "unknown";

// static checks on the shipped files: index.html, style sheets beside it, and src/
const shipped = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (!/^(node_modules|\.git|\.claude|tests?|__tests__|docs?|dist|build|coverage|\.crunchless|scripts|tools)$/i.test(f)) walk(p); } else if ([".js", ".mjs", ".ts", ".html", ".css"].includes(extname(f)) && !/\.(test|spec)\./.test(f) && !/(^|[\\/])(vite|vitest|playwright|eslint|webpack|rollup)\.config\./.test(p)) shipped.push(p); } };
if (existsSync(gameDir)) walk(gameDir);
const text = Object.fromEntries(shipped.map((p) => [p, readFileSync(p, "utf8")]));
const stripComments = (s, p) => (extname(p) === ".html" ? s.replace(/<!--[\s\S]*?-->/g, "") : s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1"));
const hits14 = [], hits15 = [];
for (const [p, raw] of Object.entries(text)) {
  const s = stripComments(raw, p);
  for (const m of s.matchAll(/<a\b[^>]*href\s*=\s*["']?\s*((?:https?:)?\/\/[^"'\s>]+)/gi)) hits14.push(`${p.slice(gameDir.length + 1)}: ${m[1]}`);
  for (const m of s.matchAll(/window\.open\s*\(|location\.(?:href|assign|replace)\s*(?:=|\()\s*["'`]https?:/g)) hits14.push(`${p.slice(gameDir.length + 1)}: ${m[0]}`);
  for (const m of s.matchAll(/http:\/\/(?!www\.w3\.org)[^\s"'`)<]*/g)) hits15.push(`${p.slice(gameDir.length + 1)}: ${m[0]}`);
}
checks.c14_no_outgoing_links = P(hits14.length === 0);
checks.c15_no_insecure_requests = P(hits15.length === 0);
const result = { gameDir, checks, static: { hits14, hits15, files: shipped.map((p) => p.slice(gameDir.length + 1)) }, obs };
for (const s of SCENARIOS) if (obs[s] && obs[s].respond) delete obs[s].respond.frame;
if (outIdx > 0) writeFileSync(process.argv[outIdx + 1], JSON.stringify(result, null, 1));
const pass = Object.values(checks).filter((v) => v === "pass").length;
console.log(JSON.stringify({ pass, of: Object.keys(checks).length, unknown: Object.entries(checks).filter(([, v]) => v === "unknown").map(([k]) => k), fail: Object.entries(checks).filter(([, v]) => v === "fail").map(([k]) => k) }));
