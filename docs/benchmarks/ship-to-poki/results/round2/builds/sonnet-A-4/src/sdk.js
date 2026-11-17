// Poki SDK wrapper. Every call is safe if the SDK is blocked (ad blockers) or fails to load.
const sdk = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);
let onPause = () => {}, onResume = () => {};

export function setAdHooks(pause, resume) { onPause = pause; onResume = resume; }

export async function initSdk() {
  try { await sdk()?.init(); } catch (e) { /* continue without SDK */ }
}
export function loadingFinished() { try { sdk()?.gameLoadingFinished(); } catch (e) {} }
export function gameplayStart() { try { sdk()?.gameplayStart(); } catch (e) {} }
export function gameplayStop() { try { sdk()?.gameplayStop(); } catch (e) {} }

export async function showAd() {
  const s = sdk();
  if (!s) return;
  onPause();
  try { await s.commercialBreak(); } catch (e) {} finally { onResume(); }
}
