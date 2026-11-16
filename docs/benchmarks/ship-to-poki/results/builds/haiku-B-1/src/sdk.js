// Poki SDK adapter. Gameplay calls only these functions. If the SDK script is
// missing or blocked, or a call fails, every function does nothing and the game still runs.
// Lifecycle rules (from developers.poki.com/guide/sdk-html5 and requirements-quality):
// gameplayStart and gameplayStop must alternate, and must not fire twice in a row.

const INIT_TIMEOUT_MS = 10000;
const AD_TIMEOUT_MS = 120000;

let playing = false;

function withSdk(fn) {
  if (!window.PokiSDK) return;
  try {
    fn(window.PokiSDK);
  } catch (err) {
    console.warn("Poki SDK call failed", err);
  }
}

// Resolves after ms, or never cancelled by the caller: race() clears the timer when the other side wins.
function race(promise, ms) {
  let timer;
  const limit = new Promise((resolve) => { timer = setTimeout(resolve, ms); });
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));
}

export async function initSdk() {
  if (!window.PokiSDK) return;
  try {
    // The docs say to keep the game going on both branches, so init is not required for play.
    await race(window.PokiSDK.init(), INIT_TIMEOUT_MS);
  } catch (err) {
    console.warn("Poki SDK init failed; continuing", err);
  }
}

export function loadingFinished() {
  withSdk((p) => p.gameLoadingFinished());
}

export function gameplayStart() {
  if (playing) return;
  playing = true;
  withSdk((p) => p.gameplayStart());
}

export function gameplayStop() {
  if (!playing) return;
  playing = false;
  withSdk((p) => p.gameplayStop());
}

// Resolves when the break is over, or at once when no ad plays.
// onAdStart runs only when an ad will show; use it to mute audio.
export async function commercialBreak(onAdStart) {
  if (!window.PokiSDK) return;
  try {
    await race(window.PokiSDK.commercialBreak(onAdStart), AD_TIMEOUT_MS);
  } catch (err) {
    console.warn("Poki commercial break failed; continuing", err);
  }
}
