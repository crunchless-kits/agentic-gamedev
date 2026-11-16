// Poki SDK wrapper. Every call is a no-op when the SDK script is not loaded
// (local development, or the CDN being blocked), so the game still runs.
const poki = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);

export async function initSdk() {
  try {
    await poki()?.init();
  } catch (err) {
    console.warn("Poki SDK init failed", err);
  }
}

export function loadingFinished() {
  poki()?.gameLoadingFinished();
}

export function gameplayStart() {
  poki()?.gameplayStart();
}

export function gameplayStop() {
  poki()?.gameplayStop();
}

// onStart fires when the ad begins (used to mute audio). Resolves when the
// break is over. A failed or missing ad never blocks gameplay.
export async function showAd(onStart) {
  try {
    await poki()?.commercialBreak(onStart);
  } catch (err) {
    console.warn("Commercial break failed", err);
  }
}
