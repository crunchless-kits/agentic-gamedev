// Poki SDK wrapper. If the SDK is missing or blocked, every call is a no-op and the game still runs.
import { setAudioMuted } from "./audio.js";

const poki = () => window.PokiSDK ?? null;

// Tracks an open gameplay session so gameplayStart/gameplayStop never fire twice in a row.
let sessionOpen = false;

export async function initSdk() {
  try {
    await poki()?.init();
  } catch {
    // Keep the game playable even if the SDK fails to initialise.
  }
}

export function gameplayStart() {
  if (sessionOpen) return;
  sessionOpen = true;
  poki()?.gameplayStart();
}

export function gameplayStop() {
  if (!sessionOpen) return;
  sessionOpen = false;
  poki()?.gameplayStop();
}

// Gameplay stops before the ad, and game audio is muted while it plays.
export async function showAd() {
  gameplayStop();
  setAudioMuted(true);
  try {
    await poki()?.commercialBreak();
  } catch {
    // Ignore ad errors so the game can continue.
  } finally {
    setAudioMuted(false);
  }
}
