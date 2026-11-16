// Poki platform adapter. Gameplay calls only these functions, never PokiSDK directly.
// Every call is a no-op when the SDK is missing (ad blocker, offline, local run).
// Rules from https://developers.poki.com/guide/sdk-html5 and /guide/requirements-quality (checked 2026-11-16):
// gameplayStart on first input, gameplayStop on any interruption, no duplicate event in a row.

const INIT_TIMEOUT_MS = 3000;
const BREAK_TIMEOUT_MS = 120000; // safety net so a stuck ad can never freeze the game

let inited = false;

function adapter() {
  return typeof PokiSDK !== "undefined" ? PokiSDK : null;
}

function warn(err) {
  console.warn("Poki SDK:", err);
}

export async function initSdk() {
  const p = adapter();
  if (!p) return false;
  try {
    await Promise.race([
      Promise.resolve(p.init()),
      new Promise((_, reject) => setTimeout(() => reject(new Error("init timeout")), INIT_TIMEOUT_MS)),
    ]);
  } catch (err) {
    warn(err); // the docs say to load the game anyway
  }
  inited = true;
  return true;
}

export function loadingFinished() {
  const p = adapter();
  if (p && inited) try { p.gameLoadingFinished(); } catch (err) { warn(err); }
}

export function gameplayStart() {
  const p = adapter();
  if (p && inited) try { p.gameplayStart(); } catch (err) { warn(err); }
}

export function gameplayStop() {
  const p = adapter();
  if (p && inited) try { p.gameplayStop(); } catch (err) { warn(err); }
}

// onAdStart runs only when an ad will actually show; use it to pause and mute.
// Resolves when the break is over (or at once when no ad was shown).
export async function commercialBreak(onAdStart) {
  const p = adapter();
  if (!p || !inited) return;
  try {
    await Promise.race([
      Promise.resolve(p.commercialBreak(onAdStart)),
      new Promise((resolve) => setTimeout(resolve, BREAK_TIMEOUT_MS)),
    ]);
  } catch (err) {
    warn(err);
  }
}

export function openExternal(url) {
  const p = adapter();
  if (p && inited) try { p.openExternalLink(url); } catch (err) { warn(err); }
}
