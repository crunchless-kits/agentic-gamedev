// Poki SDK adapter. Gameplay talks only to this module; if the SDK is missing
// (ad blocker, offline, local dev) every call degrades to a no-op.
// Names per references/poki-sdk-notes.md (verified 2026-11-06).
let live = false;

export async function initSdk() {
  try {
    if (typeof PokiSDK === "undefined") throw new Error("PokiSDK not loaded");
    await PokiSDK.init();
    live = true;
  } catch (e) {
    console.warn("Poki SDK unavailable, continuing without it", e);
  }
}

function call(name) {
  if (!live) return;
  try { PokiSDK[name](); } catch (e) { console.warn("PokiSDK." + name, e); }
}

export const loadingFinished = () => call("gameLoadingFinished");
export const gameplayStart = () => call("gameplayStart");
export const gameplayStop = () => call("gameplayStop");

// Resolves when the break is over (immediately when no ad plays).
// onAdStart runs only if an ad will actually show: pause and mute there.
export async function showAd(onAdStart) {
  if (!live) return;
  try { await PokiSDK.commercialBreak(onAdStart); } catch (e) { console.warn("commercialBreak", e); }
}
