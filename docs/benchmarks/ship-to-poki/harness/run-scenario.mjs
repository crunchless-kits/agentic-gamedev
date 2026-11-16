// Runs one scenario against a game folder and prints one JSON line of observations.
//   node run-scenario.mjs <gameDir> <scenario>
// Scenarios: normal, adblock, nosdk, nofetch, nostorage, corrupt, audioblocked, fps60, fps144
import { createEnv, frameDiff } from "./env.mjs";

const [, , gameDir, scenario] = process.argv;
const OPT = { normal: {}, adblock: { sdk: "reject" }, nosdk: { sdk: "missing" }, nofetch: { fetch: "fail" }, nostorage: { storage: "throw" }, corrupt: { storage: "corrupt" }, audioblocked: { audio: "blocked" }, fps60: {}, fps144: {} };
if (!(scenario in OPT)) { console.log(JSON.stringify({ scenario, fatal: "unknown scenario" })); process.exit(2); }

const env = await createEnv(gameDir, OPT[scenario]);
const fps = scenario === "fps144" ? 144 : 60;
const F = 1000 / fps;
const sec = (s) => Math.round(s * fps);
const R = { scenario, notes: [] };
const count = (m) => env.sdkCalls(m).length;
const press = async (k, hold = 2) => { const prevented = await env.key("keydown", k); await env.frames(hold, F); await env.key("keyup", k); return prevented; };

async function bootAndStart() {
  R.loaded = await env.load();
  R.drewAtBoot = await env.frames(sec(0.5), F);
  R.sdkBeforeInput = env.log.sdk.map((c) => c.m);
  R.musicBeforeInput = env.log.audio.filter((a) => (a.op === "play" || a.op === "bufferStart") && a.loop).length;
  await press(" ");
  await env.tap();
  await env.frames(sec(1), F);
  // Jumps are only safe early in a run: a storm passes over the start island from about 3.4 s. So the
  // first-movement probe and the key probes all happen before then, and later steps never jump.
  R.respond = await respond();
  if (R.respond.moved < 15) {
    await env.tapAllButtons();
    await env.frames(sec(1), F);
    R.respond = await respond();
    R.notes.push("start needed a button tap");
  }
}
async function respond() {
  const f0 = env.frame();
  await env.key("keydown", "ArrowRight");
  await env.frames(sec(0.25), F);
  await env.key("keyup", "ArrowRight");
  const f1 = env.frame();
  const drew = await env.frames(10, F);
  const d = frameDiff(f0, f1);
  return { moved: d.max, compared: d.compared, alive: drew >= 8, frame: f1 };
}
async function die() {
  const before = count("gameplayStop");
  await env.key("keydown", "ArrowLeft");
  let frames = 0;
  while (frames < sec(6) && count("gameplayStop") === before) { await env.step(F); frames++; }
  await env.key("keyup", "ArrowLeft");
  const stopLogged = count("gameplayStop") > before;
  await env.frames(sec(1), F);
  return { stopLogged, frames };
}
async function restart() {
  const b0 = count("commercialBreak"), s0 = count("gameplayStart");
  await press(" ");
  await env.frames(5, F);
  if (count("commercialBreak") === b0 && count("gameplayStart") === s0) { await env.tap(); await env.tapAllButtons(); await env.frames(5, F); R.notes.push("restart needed a tap"); }
  return { breakCalled: count("commercialBreak") - b0, pending: env.pendingBreaks() };
}

try {
  await bootAndStart();
  if (scenario === "audioblocked") {
    await env.frames(sec(2), F);
    R.unhandled = env.log.errors.filter((e) => e.where === "unhandledRejection").length;
  } else if (scenario === "normal") {
    R.gameplayStartBeforeInput = R.sdkBeforeInput.includes("gameplayStart");
    R.loadingFinished = count("gameLoadingFinished");
    R.gameplayStartAfterInput = count("gameplayStart");
    R.prevented = {};
    for (const k of ["ArrowUp", "ArrowDown", " "]) { R.prevented[k] = await press(k); await env.frames(3, F); }
    const c0 = env.log.console.length;
    await env.frames(sec(1), F);
    R.consolePerSecond = env.log.console.length - c0;

    R.death = await die();
    R.listenersAfterFirstRun = env.keyListeners();
    const startsBeforeRestart = count("gameplayStart");
    R.restartSeqs = [];
    const seq0 = env.log.sdk.length;
    const r1 = await restart();
    R.breakCalled = r1.breakCalled;
    R.breakPending = r1.pending;
    if (r1.pending) {
      await env.frames(10, F);
      R.audibleDuringBreak = env.audibleNow();
      const b0 = count("commercialBreak"), s0 = count("gameplayStart");
      await press(" ");
      await env.key("keydown", "ArrowRight"); await env.frames(10, F); await env.key("keyup", "ArrowRight");
      await press(" ");
      await env.frames(20, F);
      R.extraBreaksDuringBreak = count("commercialBreak") - b0;
      R.startsDuringBreak = count("gameplayStart") - s0;
      for (let i = 0; i < 6 && env.pendingBreaks(); i++) { await env.resolveBreaks(); await env.frames(2, F); }
    }
    await env.frames(sec(0.5), F);
    await press("ArrowRight", 6);
    await env.frames(sec(0.5), F);
    R.startsAfterBreak = count("gameplayStart") - startsBeforeRestart - (R.startsDuringBreak || 0);
    R.restartSeqs.push(env.log.sdk.slice(seq0).map((c) => c.m));
    R.audibleAfterBreak = env.audibleNow();

    R.laterDeaths = [];
    for (let i = 0; i < 2; i++) {
      const d = await die();
      const s0 = count("gameplayStart");
      const seqN = env.log.sdk.length;
      const r = await restart();
      await env.frames(5, F);
      for (let j = 0; j < 6 && env.pendingBreaks(); j++) { await env.resolveBreaks(); await env.frames(2, F); }
      await env.frames(sec(0.5), F);
      await press("ArrowRight", 6);
      await env.frames(sec(0.5), F);
      R.laterDeaths.push({ stopLogged: d.stopLogged, breakCalled: r.breakCalled, startsAfter: count("gameplayStart") - s0 });
      R.restartSeqs.push(env.log.sdk.slice(seqN).map((c) => c.m));
    }
    R.listenersAfterThreeRestarts = env.keyListeners();

    const fa = env.frame();
    const stopsBeforeHide = count("gameplayStop");
    await env.setHidden(true);
    await env.idle(200);
    R.audibleWhileHidden = env.audibleNow();
    R.stopOnHidden = count("gameplayStop") > stopsBeforeHide;
    await env.idle(5050);
    await env.setHidden(false);
    await env.frames(3, F);
    const fb = env.frame();
    const hd = frameDiff(fa, fb);
    R.hiddenJump = { max: hd.max, compared: hd.compared };
    R.drewAfterHidden = await env.frames(10, F);
  }
} catch (e) {
  R.fatal = String((e && e.stack) || e).split("\n").slice(0, 3).join(" | ");
}
R.startsWhileBreakPending = env.log.sdk.filter((c) => c.m === "gameplayStart" && c.breakPending).length;
R.sdk = env.log.sdk.map((c) => `${c.m}@${c.frame}${c.beforeInput ? "*" : ""}${c.breakPending ? "!" : ""}`);
R.audioPlays = env.log.audio.filter((a) => a.op !== "pause").slice(0, 12);
R.errors = env.log.errors.slice(0, 8);
R.fetches = env.log.fetches.slice(0, 6);
R.envNotes = [...new Set(env.log.notes)].slice(0, 8);
R.consoleSample = env.log.console.slice(0, 3);
env.out(R);
process.exit(0);
