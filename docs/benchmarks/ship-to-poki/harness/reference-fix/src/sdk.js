// Poki SDK wrapper. Every call is safe when the SDK is missing or blocked.
const sdk = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);
const call = (name, ...args) => { try { const s = sdk(); return s ? s[name](...args) : undefined; } catch { return undefined; } };

export async function initSdk() {
  try { const s = sdk(); if (!s) return false; await s.init(); return true; } catch { return false; }
}
export const loadingFinished = () => call("gameLoadingFinished");
export const gameplayStart = () => call("gameplayStart");
export const gameplayStop = () => call("gameplayStop");
export async function commercialBreak(onAdStart) {
  try { await call("commercialBreak", onAdStart); } catch { /* no ad */ }
}
