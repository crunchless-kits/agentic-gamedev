// Poki SDK wrapper. Every call is safe if the SDK is blocked (ad blockers) or missing.
let ready = false;
let playing = false;

export async function initSdk() {
  try {
    if (typeof PokiSDK === "undefined") return;
    await PokiSDK.init();
    ready = true;
  } catch (e) {
    // SDK blocked or failed: the game must still run.
  }
}

export function loadingFinished() {
  if (ready) PokiSDK.gameLoadingFinished();
}

export function gameplayStart() {
  if (ready && !playing) { playing = true; PokiSDK.gameplayStart(); }
}

export function gameplayStop() {
  if (ready && playing) { playing = false; PokiSDK.gameplayStop(); }
}

export async function showAd(onStart, onFinish) {
  if (!ready) return;
  try {
    await PokiSDK.commercialBreak(onStart);
  } catch (e) {}
  if (onFinish) onFinish();
}
