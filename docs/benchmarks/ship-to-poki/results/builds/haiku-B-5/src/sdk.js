// Poki SDK adapter. Gameplay code calls only these functions, never window.PokiSDK.
// Verified against developers.poki.com/guide/sdk-html5 and requirements-quality (2026-11-16).
// If the SDK script is blocked or missing, every call becomes a no-op and the game still runs.

const BREAK_TIMEOUT_MS = 60000; // safety net: never leave the game paused if a break never resolves

function sdk() {
  return typeof window.PokiSDK === "undefined" ? null : window.PokiSDK;
}

function call(fn) {
  const s = sdk();
  if (!s) return undefined;
  try {
    return fn(s);
  } catch (err) {
    return undefined; // SDK failures must not break gameplay
  }
}

// Resolves when init finishes or fails. A failed init still lets the game load.
export async function initSdk() {
  const s = sdk();
  if (!s) return;
  try {
    await s.init();
  } catch (err) {
    // Documented behaviour: continue without SDK features.
  }
}

export function loadingFinished() {
  call((s) => s.gameLoadingFinished());
}

export function gameplayStart() {
  call((s) => s.gameplayStart());
}

export function gameplayStop() {
  call((s) => s.gameplayStop());
}

// Shows an interstitial break. onAdStart runs only when an ad will actually play;
// use it to pause simulation and mute audio. Resolves when the break is over.
export function commercialBreak(onAdStart) {
  const s = sdk();
  if (!s) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, BREAK_TIMEOUT_MS);
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    try {
      Promise.resolve(s.commercialBreak(onAdStart)).then(done, done);
    } catch (err) {
      done();
    }
  });
}
