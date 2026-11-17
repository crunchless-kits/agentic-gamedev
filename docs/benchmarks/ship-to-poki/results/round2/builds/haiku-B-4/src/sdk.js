// Poki SDK adapter. Gameplay calls only these functions. Each one is a no-op
// when PokiSDK is missing (script blocked or ad blocker) or when a call throws,
// so the game stays playable without the SDK.
// Verified against https://developers.poki.com/guide/sdk-html5 on 2026-11-16.

const INIT_TIMEOUT_MS = 5000;
const BREAK_TIMEOUT_MS = 30000;

let gameplayActive = false;

function poki() {
  return typeof PokiSDK !== "undefined" ? PokiSDK : null;
}

function safe(fn) {
  try { return fn(); } catch (e) { console.warn("Poki SDK call failed", e); return undefined; }
}

export async function initSdk() {
  const p = poki();
  if (!p) return;
  const timeout = new Promise((resolve) => setTimeout(resolve, INIT_TIMEOUT_MS));
  await Promise.race([safe(() => p.init()) ?? Promise.resolve(), timeout]).catch(() => {});
}

export function loadingFinished() {
  const p = poki();
  if (p) safe(() => p.gameLoadingFinished());
}

// Paired with gameplayStop(); repeated calls without a stop in between are ignored.
export function gameplayStart() {
  const p = poki();
  if (!p || gameplayActive) return;
  gameplayActive = true;
  safe(() => p.gameplayStart());
}

export function gameplayStop() {
  const p = poki();
  if (!p || !gameplayActive) return;
  gameplayActive = false;
  safe(() => p.gameplayStop());
}

// Resolves when the break is over. onStart runs when the ad begins (mute and pause there).
// Never resolves forever: after BREAK_TIMEOUT_MS the game goes on.
export async function commercialBreak(onStart) {
  const p = poki();
  if (!p) return;
  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(resolve, BREAK_TIMEOUT_MS); });
  const result = safe(() => p.commercialBreak(onStart));
  await Promise.race([Promise.resolve(result).catch(() => {}), timeout]);
  clearTimeout(timer);
}
