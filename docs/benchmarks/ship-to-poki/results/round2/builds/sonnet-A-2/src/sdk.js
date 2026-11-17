// Poki SDK wrapper. Every call is safe if the SDK is blocked (ad blockers) or missing.
const sdk = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);

export async function initSdk() {
  try { await sdk()?.init(); } catch (e) { /* SDK blocked: run the game anyway */ }
  try { sdk()?.gameLoadingFinished(); } catch (e) {}
}

export function gameplayStart() { try { sdk()?.gameplayStart(); } catch (e) {} }
export function gameplayStop() { try { sdk()?.gameplayStop(); } catch (e) {} }

// onStart/onFinish let the caller mute audio and block input while the ad plays.
export async function showAd(onStart, onFinish) {
  try {
    const s = sdk();
    if (s) await s.commercialBreak(onStart);
  } catch (e) {
  } finally {
    onFinish?.();
  }
}
