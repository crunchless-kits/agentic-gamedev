// Poki SDK adapter. Gameplay code only calls these functions, never PokiSDK directly.
// Every call is a no-op when the SDK is missing (ad blocker, local dev), so the game still runs.
// Semantics verified 2026-11-16 against https://developers.poki.com/guide/sdk-html5
let ready = false;
let playing = false;

const sdk = () => (ready ? window.PokiSDK : null);

export async function initSdk() {
  try {
    await window.PokiSDK.init();
    ready = true;
  } catch (e) {
    ready = false; // SDK unavailable: continue without ads
  }
}

export function loadingFinished() {
  sdk()?.gameLoadingFinished();
}

// Poki wants no double start or double stop in a row.
export function gameplayStart() {
  if (playing) return;
  playing = true;
  sdk()?.gameplayStart();
}

export function gameplayStop() {
  if (!playing) return;
  playing = false;
  sdk()?.gameplayStop();
}

// Resolves when the break is over. onStart runs only if an ad will actually show (mute/pause there).
export async function showAd(onStart) {
  const s = sdk();
  if (!s) return;
  try {
    await s.commercialBreak(onStart);
  } catch (e) {
    // treat a failed break as no ad
  }
}
