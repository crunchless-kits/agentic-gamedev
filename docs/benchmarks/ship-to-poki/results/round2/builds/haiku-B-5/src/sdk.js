// Poki SDK adapter. The game talks only to this module. If the SDK script is
// blocked or its calls fail, every function here becomes a no-op and the game
// keeps running. Snapshot: .claude/skills/poki-integration/references/poki-sdk-notes.md
// (verified 2026-11-16 against developers.poki.com).

function poki() {
  return (typeof window !== "undefined" && window.PokiSDK) || null;
}

function call(name) {
  const p = poki();
  if (!p || typeof p[name] !== "function") return;
  try {
    p[name]();
  } catch (err) {
    console.warn(`Poki ${name} failed`, err);
  }
}

// Resolves to true when the SDK initialised. Never rejects: the docs say to
// load the game anyway when init fails.
export async function initSdk() {
  const p = poki();
  if (!p) return false;
  try {
    await p.init();
    return true;
  } catch (err) {
    console.warn("Poki init failed; continuing without the SDK", err);
    return false;
  }
}

export function gameLoadingFinished() {
  call("gameLoadingFinished");
}

export function gameplayStart() {
  call("gameplayStart");
}

export function gameplayStop() {
  call("gameplayStop");
}

const BREAK_TIMEOUT_MS = 60000; // fallback so a stalled ad cannot soft-lock the game

// Runs a commercial break. onStart is called when the ad begins (pause and mute
// there). The promise resolves when the break is over, when the timeout passes,
// or when the SDK fails, so the caller can always resume in a finally block.
export async function commercialBreak(onStart) {
  const p = poki();
  if (!p) return;
  try {
    await Promise.race([
      p.commercialBreak(onStart),
      new Promise((resolve) => setTimeout(resolve, BREAK_TIMEOUT_MS)),
    ]);
  } catch (err) {
    console.warn("Poki commercialBreak failed", err);
  }
}
