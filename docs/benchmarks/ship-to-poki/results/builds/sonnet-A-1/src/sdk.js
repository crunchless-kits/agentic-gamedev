// Poki SDK wrapper. Every call is safe if the SDK is missing (ad blockers
// commonly block it) - the game must still run.
const sdk = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);

export async function initSdk() {
  try {
    await sdk()?.init();
  } catch (e) {
    // Poki docs: continue even if init fails (e.g. ad blocker).
  }
  try { sdk()?.gameLoadingFinished(); } catch (e) {}
}

export function gameplayStart() {
  try { sdk()?.gameplayStart(); } catch (e) {}
}

export function gameplayStop() {
  try { sdk()?.gameplayStop(); } catch (e) {}
}

// Resolves when the break is over (or immediately if ads are unavailable).
// onStart is called when an ad actually begins so the game can mute audio.
export async function showAd(onStart) {
  try {
    const s = sdk();
    if (s) await s.commercialBreak(onStart);
  } catch (e) {}
}
