// Poki SDK wrapper. Every call is safe when the SDK is blocked (ad blockers) or fails to load.
const sdk = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);
const safe = (fn) => { try { fn(); } catch (e) { /* ignore SDK errors */ } };

export async function initSdk() {
  try { await sdk()?.init(); } catch (e) { /* continue without SDK */ }
}
export function loadingFinished() { safe(() => sdk()?.gameLoadingFinished()); }
export function gameplayStart() { safe(() => sdk()?.gameplayStart()); }
export function gameplayStop() { safe(() => sdk()?.gameplayStop()); }

// onStart is called when the ad begins (mute audio), the promise resolves when it is over.
export async function showAd(onStart) {
  try { await sdk()?.commercialBreak(onStart); } catch (e) { /* ignore */ }
}
