// Poki platform adapter. Gameplay calls only these functions; nothing else touches PokiSDK.
// Every call is a no-op when the SDK is missing or failed to start, so the game still runs.
// Verified against https://developers.poki.com/guide/sdk-html5 (see .claude/skills/poki-integration/references/poki-sdk-notes.md).

const INIT_TIMEOUT_MS = 4000;
const BREAK_TIMEOUT_MS = 60000; // fallback so a stuck ad callback cannot freeze the game
let poki = null;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

export async function initSdk() {
  const sdk = window.PokiSDK;
  if (!sdk) return false;
  try {
    await withTimeout(sdk.init(), INIT_TIMEOUT_MS);
    poki = sdk;
    return true;
  } catch (err) {
    console.warn("Poki SDK unavailable, continuing without it", err);
    return false;
  }
}

export function loadingFinished() {
  poki?.gameLoadingFinished();
}

export function gameplayStart() {
  poki?.gameplayStart();
}

export function gameplayStop() {
  poki?.gameplayStop();
}

// onStart runs only when an ad actually plays; use it to mute audio and pause.
export async function commercialBreak(onStart) {
  if (!poki) return;
  try {
    await withTimeout(poki.commercialBreak(onStart), BREAK_TIMEOUT_MS);
  } catch (err) {
    console.warn("Commercial break did not finish cleanly", err);
  }
}
