// Poki SDK wrapper. If the SDK script is blocked or missing, every call is a no-op
// so the game still runs.
const poki = typeof PokiSDK !== "undefined" ? PokiSDK : null;

export async function initSdk() {
  if (!poki) return;
  try {
    await poki.init();
  } catch (e) {
    console.warn("Poki SDK init failed", e);
  }
}

export function loadingStart() { poki?.gameLoadingStart(); }
export function loadingFinished() { poki?.gameLoadingFinished(); }
export function gameplayStart() { poki?.gameplayStart(); }
export function gameplayStop() { poki?.gameplayStop(); }

// onStart runs when the ad begins (mute audio there); onEnd runs after it finishes.
export async function showAd(onStart, onEnd) {
  if (poki) {
    try {
      await poki.commercialBreak(onStart);
    } catch (e) {
      console.warn("Commercial break failed", e);
    }
  }
  onEnd?.();
}
