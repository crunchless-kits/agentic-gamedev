// Poki SDK adapter. Gameplay calls only these functions, never window.PokiSDK.
// Every call is a no-op when the SDK is missing, blocked, or failed to init,
// so the game stays playable. Lifecycle order follows Poki's HTML5 SDK docs
// (snapshot: .claude/skills/poki-integration/references/poki-sdk-notes.md).

const INIT_TIMEOUT_MS = 3000;
const BREAK_TIMEOUT_MS = 30000; // fallback only; the break promise normally resolves first

let enabled = false;

function sdk() {
  return enabled ? window.PokiSDK : undefined;
}

function safe(fn) {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

// Resolves true when init succeeded. Resolves false on rejection, timeout, or missing script.
export async function initSdk() {
  const p = typeof window !== "undefined" ? window.PokiSDK : undefined;
  if (!p) return false;
  const ready = new Promise((resolve) => {
    const result = safe(() => p.init());
    Promise.resolve(result).then(() => resolve(true), () => resolve(false));
  });
  const timeout = new Promise((resolve) => setTimeout(() => resolve(false), INIT_TIMEOUT_MS));
  enabled = await Promise.race([ready, timeout]);
  return enabled;
}

export function gameLoadingFinished() {
  const p = sdk();
  if (p) safe(() => p.gameLoadingFinished());
}

export function gameplayStart() {
  const p = sdk();
  if (p) safe(() => p.gameplayStart());
}

export function gameplayStop() {
  const p = sdk();
  if (p) safe(() => p.gameplayStop());
}

// Requests a commercial break. onStart runs when the ad begins (pause and mute there).
// Resolves when the break is over, or after a fallback timeout.
export function commercialBreak(onStart) {
  const p = sdk();
  if (!p) return Promise.resolve();
  const brk = Promise.resolve()
    .then(() => p.commercialBreak(() => safe(() => onStart && onStart())))
    .catch(() => {});
  const timeout = new Promise((resolve) => setTimeout(resolve, BREAK_TIMEOUT_MS));
  return Promise.race([brk, timeout]);
}
