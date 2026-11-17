// Poki SDK wrapper. Every call is guarded: the game must stay playable when
// the script is blocked (PokiSDK undefined) or init() rejects (ad blocker).
const BREAK_TIMEOUT_MS = 60000;
const INIT_TIMEOUT_MS = 5000;

const sdk = () => (typeof PokiSDK !== "undefined" ? PokiSDK : null);

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

async function call(name, ...args) {
  try {
    const s = sdk();
    if (s && typeof s[name] === "function") return await s[name](...args);
  } catch (e) {
    // SDK failure must never break the game.
  }
  return undefined;
}

export async function initSdk() {
  try {
    const s = sdk();
    if (!s) return false;
    await Promise.race([s.init(), timeout(INIT_TIMEOUT_MS)]);
    return true;
  } catch (e) {
    return false;
  }
}

export const loadingFinished = () => call("gameLoadingFinished");
export const gameplayStart = () => call("gameplayStart");
export const gameplayStop = () => call("gameplayStop");

// Resolves when the break is over (or after a timeout). The caller pauses,
// mutes, and locks input before calling this and restores them after.
export async function commercialBreak() {
  await Promise.race([call("commercialBreak"), timeout(BREAK_TIMEOUT_MS).catch(() => {})]);
}
