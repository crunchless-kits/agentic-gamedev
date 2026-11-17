// Game-owned portal interface. Poki is the only adapter; every call is guarded so the
// game stays playable when the SDK script is blocked or init() rejects.
const poki = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);

function safe(fn) {
  try { return fn(); } catch (e) { return undefined; }
}

export async function initSdk() {
  const sdk = poki();
  if (!sdk) return false;
  try { await sdk.init(); return true; } catch (e) { return false; }
}

export function loadingFinished() { safe(() => poki()?.gameLoadingFinished()); }
export function gameplayStart() { safe(() => poki()?.gameplayStart()); }
export function gameplayStop() { safe(() => poki()?.gameplayStop()); }

// Resolves when the break is over (immediately without an SDK). `onStart` runs before the
// ad can show, so the caller can pause and mute. A 60 s cap keeps the game from hanging.
export async function showAd(onStart) {
  const sdk = poki();
  if (!sdk) return;
  try {
    await Promise.race([
      sdk.commercialBreak(() => { if (onStart) onStart(); }),
      new Promise((r) => setTimeout(r, 60000)),
    ]);
  } catch (e) { /* ad failed: carry on */ }
}
