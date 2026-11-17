// Poki SDK adapter. Gameplay calls only this file; every call is safe when
// the SDK is blocked, missing, or throws (the game must stay playable).
const sdk = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);

function safe(fn) {
  try { return fn(); } catch (e) { return undefined; }
}

export async function initSdk() {
  const s = sdk();
  if (!s) return;
  try { await s.init(); } catch (e) { /* ad blocker: load the game anyway */ }
}

export function loadingFinished() { safe(() => sdk()?.gameLoadingFinished()); }
export function gameplayStart() { safe(() => sdk()?.gameplayStart()); }
export function gameplayStop() { safe(() => sdk()?.gameplayStop()); }

// onStart runs when the break begins (pause and mute); resolves when it is over.
export async function showAd(onStart) {
  const s = sdk();
  if (!s) return;
  try { await s.commercialBreak(onStart); } catch (e) { /* treat as no ad */ }
}
