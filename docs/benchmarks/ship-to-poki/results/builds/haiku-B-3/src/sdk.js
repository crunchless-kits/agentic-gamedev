// Platform adapter: the only module that talks to the Poki SDK.
// Gameplay calls these functions; with no SDK (missing script, blocked, or
// init failed) every call is a safe no-op so the game still runs.
// Verified against https://developers.poki.com/guide/sdk-html5 (2026-11-16).

const INIT_TIMEOUT_MS = 5000;
const BREAK_TIMEOUT_MS = 60000; // safety net if the break promise never settles

let ready = false;
let inGameplay = false;

function poki() {
  return globalThis.PokiSDK ?? null;
}

// Never rejects. Resolves when the SDK is ready or after a timeout.
export async function initSdk() {
  const sdk = poki();
  if (!sdk) return false;
  const init = Promise.resolve()
    .then(() => sdk.init())
    .then(() => { ready = true; })
    .catch((err) => console.warn("Poki SDK unavailable, running without ads", err));
  const timeout = new Promise((resolve) => setTimeout(resolve, INIT_TIMEOUT_MS));
  await Promise.race([init, timeout]);
  return ready;
}

export function loadingFinished() {
  if (ready) poki().gameLoadingFinished();
}

// Paired start/stop: duplicate calls are ignored so the SDK sees strict pairs.
export function gameplayStart() {
  if (!ready || inGameplay) return;
  inGameplay = true;
  poki().gameplayStart();
}

export function gameplayStop() {
  if (!ready || !inGameplay) return;
  inGameplay = false;
  poki().gameplayStop();
}

// Resolves when the break ends, or at once when no ad plays.
// onAdStart runs only if an ad will show: mute and pause there.
export function commercialBreak(onAdStart) {
  if (!ready) return Promise.resolve();
  const sdk = poki();
  const brk = Promise.resolve()
    .then(() => sdk.commercialBreak(onAdStart))
    .catch((err) => console.warn("commercialBreak failed", err));
  const timeout = new Promise((resolve) => setTimeout(resolve, BREAK_TIMEOUT_MS));
  return Promise.race([brk, timeout]);
}
