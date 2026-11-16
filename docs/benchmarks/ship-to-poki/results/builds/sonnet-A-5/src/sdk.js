// Poki SDK wrapper. Every call is safe if the SDK is blocked (ad blockers) or fails.
const sdk = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);

export async function initSdk() {
  try { await sdk()?.init(); } catch (e) { /* continue without SDK */ }
}
export function loadingFinished() { try { sdk()?.gameLoadingFinished(); } catch (e) {} }
export function gameplayStart() { try { sdk()?.gameplayStart(); } catch (e) {} }
export function gameplayStop() { try { sdk()?.gameplayStop(); } catch (e) {} }

export async function showAd(onStart, onEnd) {
  try {
    const s = sdk();
    if (s) await s.commercialBreak(onStart);
  } catch (e) { /* ad failure must not block the game */ }
  finally { onEnd && onEnd(); }
}
