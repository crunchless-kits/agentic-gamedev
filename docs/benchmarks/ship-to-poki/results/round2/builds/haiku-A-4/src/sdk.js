// Poki SDK wrapper. Every call is guarded so the game still runs if the SDK
// script fails to load (e.g. blocked, or running outside Poki).
const poki = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);

export async function initSdk() {
  try {
    await poki()?.init();
  } catch (err) {
    console.warn("Poki SDK init failed", err);
  }
}

export function loadingFinished() {
  poki()?.gameLoadingFinished?.();
}

export function gameplayStart() {
  poki()?.gameplayStart?.();
}

export function gameplayStop() {
  poki()?.gameplayStop?.();
}

// Shows an interstitial. onStart/onEnd let the caller mute and resume audio.
export async function showAd(onStart, onEnd) {
  try {
    await poki()?.commercialBreak(onStart);
  } catch (err) {
    console.warn("Commercial break failed", err);
  } finally {
    onEnd?.();
  }
}
