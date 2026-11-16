// Poki SDK wrapper. If the SDK script did not load (local dev, blockers),
// every call becomes a no-op so the game still runs.
function call(name, ...args) {
  const sdk = typeof window !== "undefined" ? window.PokiSDK : undefined;
  if (!sdk || typeof sdk[name] !== "function") return undefined;
  try {
    return sdk[name](...args);
  } catch (err) {
    console.warn(`PokiSDK.${name} failed`, err);
    return undefined;
  }
}

async function callAsync(name, ...args) {
  try {
    await call(name, ...args);
  } catch (err) {
    console.warn(`PokiSDK.${name} failed`, err);
  }
}

export function initSdk() {
  return callAsync("init");
}

export function gameLoadingFinished() {
  call("gameLoadingFinished");
}

export function gameplayStart() {
  call("gameplayStart");
}

export function gameplayStop() {
  call("gameplayStop");
}

// onStart is called when the ad begins, so the caller can mute audio.
export function showAd(onStart) {
  return callAsync("commercialBreak", onStart);
}
