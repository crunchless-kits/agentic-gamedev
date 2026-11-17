// Poki SDK wrapper. Every call is safe if the SDK failed to load (e.g. ad blocker),
// so the game still runs without it.
const poki = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);
let playing = false;

export async function initSdk() {
  try {
    await poki()?.init();
  } catch (e) {
    // SDK init fails with ad blockers; continue without ads.
  }
}

export function loadingFinished() {
  try { poki()?.gameLoadingFinished(); } catch (e) {}
}

export function gameplayStart() {
  if (playing) return;
  playing = true;
  try { poki()?.gameplayStart(); } catch (e) {}
}

export function gameplayStop() {
  if (!playing) return;
  playing = false;
  try { poki()?.gameplayStop(); } catch (e) {}
}

// Shows a commercial break; `setMuted(true/false)` is called around it so audio is silent during ads.
export async function showAd(setMuted) {
  const sdk = poki();
  if (!sdk) return;
  try {
    await sdk.commercialBreak(() => setMuted(true));
  } catch (e) {
  } finally {
    setMuted(false);
  }
}
