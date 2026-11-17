// Poki SDK adapter. Gameplay calls only the functions below. Each one does
// nothing when PokiSDK is missing (ad blocker, blocked script) and never throws
// into the game loop.

const INIT_TIMEOUT_MS = 10000;   // if init never settles, play anyway
const BREAK_TIMEOUT_MS = 30000;  // if a break never reports back, resume anyway

function poki() {
  return typeof window !== "undefined" && window.PokiSDK ? window.PokiSDK : null;
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(resolve, ms); });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

export async function initSdk() {
  const sdk = poki();
  if (!sdk) return;
  try {
    await withTimeout(sdk.init(), INIT_TIMEOUT_MS);
  } catch {
    // Blocked or failed: the game still runs.
  }
}

export function loadingFinished() {
  const sdk = poki();
  try { sdk?.gameLoadingFinished(); } catch { /* ignore */ }
}

export function gameplayStart() {
  const sdk = poki();
  try { sdk?.gameplayStart(); } catch { /* ignore */ }
}

export function gameplayStop() {
  const sdk = poki();
  try { sdk?.gameplayStop(); } catch { /* ignore */ }
}

// Resolves when the break is over. onStart runs when the ad begins, so the
// caller can mute audio. Callers must not send input or SDK events until it resolves.
export function commercialBreak(onStart) {
  const sdk = poki();
  if (!sdk) return Promise.resolve();
  try {
    return withTimeout(sdk.commercialBreak(onStart), BREAK_TIMEOUT_MS).catch(() => {});
  } catch {
    return Promise.resolve();
  }
}
