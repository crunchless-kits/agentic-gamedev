// Poki SDK wrapper. Every call is safe when the SDK is missing (ad blockers
// block the script) or when a call rejects: the game must still run.
import { setMuted } from "./audio.js";

let ready = false;

export async function initSdk() {
  try {
    if (typeof PokiSDK === "undefined") return;
    await PokiSDK.init();
    ready = true;
  } catch (e) {
    // SDK blocked or failed to init: continue without it.
  }
}

export function loadingFinished() {
  if (ready) try { PokiSDK.gameLoadingFinished(); } catch (e) {}
}

export function gameplayStart() {
  if (ready) try { PokiSDK.gameplayStart(); } catch (e) {}
}

export function gameplayStop() {
  if (ready) try { PokiSDK.gameplayStop(); } catch (e) {}
}

// Commercial break between runs. Mutes audio while the ad plays.
export async function showAd() {
  if (!ready) return;
  try {
    await PokiSDK.commercialBreak(() => setMuted(true));
  } catch (e) {
  } finally {
    setMuted(false);
  }
}
