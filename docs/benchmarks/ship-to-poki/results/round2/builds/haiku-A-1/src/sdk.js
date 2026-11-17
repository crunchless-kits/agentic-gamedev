// Poki SDK wrapper. Every call is a no-op when the SDK script did not load
// (offline, blocked, or running outside Poki), so the game still runs.
const poki = typeof PokiSDK !== "undefined" ? PokiSDK : null;

export function initSdk() {
  return poki ? poki.init() : Promise.resolve();
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

// Mutes game audio for the duration of the commercial break.
export async function showAd(setMuted) {
  if (!poki) return;
  try {
    await poki.commercialBreak(() => setMuted(true));
  } catch (err) {
    console.warn("Commercial break failed", err);
  } finally {
    setMuted(false);
  }
}
