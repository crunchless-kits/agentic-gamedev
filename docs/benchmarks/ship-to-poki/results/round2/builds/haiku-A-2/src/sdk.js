// Poki SDK wrapper. The SDK script is loaded in index.html. If it is missing
// (e.g. local dev), every call here becomes a no-op so the game still runs.
const sdk = typeof PokiSDK !== "undefined" ? PokiSDK : null;

export async function initSdk() {
  if (!sdk) return;
  try {
    await sdk.init();
  } catch (e) {
    console.warn("Poki SDK init failed", e);
  }
}

export function gameLoadingFinished() {
  sdk?.gameLoadingFinished?.();
}

export function gameplayStart() {
  sdk?.gameplayStart?.();
}

export function gameplayStop() {
  sdk?.gameplayStop?.();
}

// Runs a commercial break. Audio is muted by the caller around this.
export async function showAd() {
  if (!sdk) return;
  try {
    await sdk.commercialBreak();
  } catch (e) {
    console.warn("Commercial break failed", e);
  }
}
