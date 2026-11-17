// Poki SDK wrapper. Every call is guarded: the game must stay playable when the SDK is blocked or missing.
const sdk = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);

function safe(fn) {
  try { return fn(); } catch (e) { return undefined; }
}

export async function initSdk() {
  const s = sdk();
  if (!s) return false;
  try { await s.init(); return true; } catch (e) { return false; }
}

export const loadingFinished = () => safe(() => sdk()?.gameLoadingFinished());
export const gameplayStart = () => safe(() => sdk()?.gameplayStart());
export const gameplayStop = () => safe(() => sdk()?.gameplayStop());

// onStart runs when the break begins (pause and mute); the promise resolves when it is over.
export async function showAd(onStart) {
  const s = sdk();
  if (!s) return;
  try { await s.commercialBreak(onStart); } catch (e) { /* carry on */ }
}
