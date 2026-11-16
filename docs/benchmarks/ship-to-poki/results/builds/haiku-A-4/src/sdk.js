// Poki SDK wrapper. Every call is guarded so the game still runs if the
// SDK script is blocked or fails to load.
const sdk = typeof PokiSDK !== "undefined" ? PokiSDK : null;

export async function initSdk() {
  try {
    await sdk?.init();
  } catch (err) {
    console.warn("Poki SDK init failed", err);
  }
}

export function gameplayStart() {
  try { sdk?.gameplayStart(); } catch (err) { console.warn(err); }
}

export function gameplayStop() {
  try { sdk?.gameplayStop(); } catch (err) { console.warn(err); }
}

// onStart runs when the ad begins; use it to mute audio.
export async function showAd(onStart) {
  if (!sdk) return;
  try {
    await sdk.commercialBreak(onStart);
  } catch (err) {
    console.warn("Commercial break failed", err);
  }
}
