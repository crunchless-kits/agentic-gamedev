// Poki SDK wrapper. Every call is safe when the SDK is blocked (ad blockers) or missing,
// so the game never hangs or crashes because of it.
const sdk = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);

export async function initSdk() {
  try { await sdk()?.init(); } catch (e) { /* SDK blocked: continue without it */ }
}

export function loadingStart() { try { sdk()?.gameLoadingStart(); } catch (e) {} }
export function loadingFinished() { try { sdk()?.gameLoadingFinished(); } catch (e) {} }
export function gameplayStart() { try { sdk()?.gameplayStart(); } catch (e) {} }
export function gameplayStop() { try { sdk()?.gameplayStop(); } catch (e) {} }

// onStart/onEnd let the caller mute audio while an ad is playing.
export async function showAd(onStart, onEnd) {
  try {
    const s = sdk();
    if (s) await s.commercialBreak(onStart);
  } catch (e) {
    /* ad failed: carry on */
  } finally {
    onEnd?.();
  }
}
