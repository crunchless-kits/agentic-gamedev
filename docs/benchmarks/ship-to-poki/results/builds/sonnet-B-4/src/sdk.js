// Poki SDK adapter. Gameplay code only talks to this file, never to PokiSDK.
// Every call is safe when the SDK is missing (ad blocker, local run) or init failed.
// Docs checked 2026-11-16: https://developers.poki.com/guide/sdk-html5 and /guide/requirements-quality

let ready = false;
let playing = false;

export async function initSdk() {
  try {
    await window.PokiSDK.init();
    ready = true;
  } catch (e) {
    // Docs: on reject, load the game anyway. Run without ads.
    ready = false;
  }
}

export function loadingFinished() {
  if (ready) window.PokiSDK.gameLoadingFinished();
}

// Start/stop must not fire twice in a row, so track state here.
export function gameplayStart() {
  if (playing) return;
  playing = true;
  if (ready) window.PokiSDK.gameplayStart();
}

export function gameplayStop() {
  if (!playing) return;
  playing = false;
  if (ready) window.PokiSDK.gameplayStop();
}

// Resolves when the break is over, or at once when no ad shows or the SDK is absent.
// onAdStart runs only when an ad will play: mute there.
export async function commercialBreak(onAdStart) {
  if (!ready) return;
  try {
    await window.PokiSDK.commercialBreak(onAdStart);
  } catch (e) {
    // A failed break must never block the game.
  }
}

// External links must go through the SDK, never window.open or a plain href.
export function openExternalLink(url) {
  if (ready) window.PokiSDK.openExternalLink(url);
}
