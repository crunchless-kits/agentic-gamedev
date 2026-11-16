// Poki SDK wrapper (game-owned interface). Gameplay code only calls these functions.
// Every call degrades to a no-op when the SDK is missing or blocked, so the game still runs.
// Verified against https://sdk.poki.com/sdk-documentation.html (snapshot 2026-11-06).
let ready = false;

function sdk() {
  return ready && typeof PokiSDK !== "undefined" ? PokiSDK : null;
}

export async function initSdk() {
  if (typeof PokiSDK === "undefined") return;
  try {
    await PokiSDK.init();
    ready = true;
  } catch (e) {
    // Documented: rejection means the SDK is unavailable; continue without ads.
  }
}

export function loadingFinished() {
  sdk()?.gameLoadingFinished();
}

export function gameplayStart() {
  sdk()?.gameplayStart();
}

export function gameplayStop() {
  sdk()?.gameplayStop();
}

// onAdStart runs only if an ad will actually show: pause and mute there.
export async function showAd(onAdStart) {
  const s = sdk();
  if (!s) return;
  try {
    await s.commercialBreak(onAdStart);
  } catch (e) {
    // Never block the game on an ad failure.
  }
}
