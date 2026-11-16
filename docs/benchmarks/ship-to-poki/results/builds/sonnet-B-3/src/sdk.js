// Poki SDK wrapper (game-owned interface). Every call falls back to a no-op
// when the SDK is missing, blocked, or rejects, so the game always runs.
// Names per .claude/skills/poki-integration/references/poki-sdk-notes.md (verified 2026-11-06).
const sdk = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);
const safe = (fn) => { try { return fn(); } catch (e) { console.warn("Poki SDK:", e); } };

export async function initSdk() {
  const s = sdk();
  if (!s) return false;
  try { await s.init(); return true; } catch (e) { return false; }
}

export const loadingFinished = () => safe(() => sdk()?.gameLoadingFinished());
export const gameplayStart = () => safe(() => sdk()?.gameplayStart());
export const gameplayStop = () => safe(() => sdk()?.gameplayStop());

// onAdStart runs only when an ad will actually show: pause and mute there.
export async function showAd(onAdStart) {
  const s = sdk();
  if (!s) return;
  try { await s.commercialBreak(onAdStart); } catch (e) { /* no ad: continue */ }
}
