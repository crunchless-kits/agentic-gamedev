// Poki SDK wrapper. Every call is guarded so the game still runs when the SDK
// script is blocked or missing (e.g. local development).
const poki = typeof window !== "undefined" ? window.PokiSDK : undefined;

function call(name, ...args) {
  try {
    if (poki && typeof poki[name] === "function") return poki[name](...args);
  } catch (err) {
    console.warn(`Poki SDK ${name} failed`, err);
  }
  return undefined;
}

export function initSdk() {
  return Promise.resolve(call("init")).catch((err) => console.warn("Poki init failed", err));
}

export function loadingStarted() {
  call("gameLoadingStart");
}

export function loadingFinished() {
  call("gameLoadingFinished");
}

export function gameplayStarted() {
  call("gameplayStart");
}

export function gameplayStopped() {
  call("gameplayStop");
}

// onAdStart is called when the ad begins (used to mute audio).
// Resolves when the ad break is over, whether or not an ad was shown.
export function showAd(onAdStart) {
  return Promise.resolve(call("commercialBreak", onAdStart)).catch(() => {});
}
