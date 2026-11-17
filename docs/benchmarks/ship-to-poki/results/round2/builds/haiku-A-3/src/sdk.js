// Poki SDK wrapper. Every call is a no-op when the SDK script is not loaded
// (local dev offline, or the script was blocked), so the game still runs.
const poki = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);

export async function initSdk() {
  try {
    await poki()?.init();
  } catch (err) {
    console.warn("Poki SDK init failed", err);
  }
}

export function loadingStart() {
  poki()?.gameLoadingStart();
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

export async function showAd() {
  try {
    await poki()?.commercialBreak();
  } catch (err) {
    console.warn("Commercial break failed", err);
  }
}
