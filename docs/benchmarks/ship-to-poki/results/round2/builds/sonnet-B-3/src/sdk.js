// Poki adapter. Gameplay code only calls these functions, never PokiSDK directly.
// Every call is guarded: the game must stay playable when the SDK script is blocked or fails.
const BREAK_TIMEOUT_MS = 90000;

function poki() {
  return typeof PokiSDK !== "undefined" ? PokiSDK : null;
}

function call(name, ...args) {
  try {
    return poki()?.[name]?.(...args);
  } catch (err) {
    return undefined;
  }
}

export async function initSdk() {
  try {
    await poki()?.init();
  } catch (err) {
    // Docs: load the game anyway when init rejects (ad blocker).
  }
}

export const loadingFinished = () => call("gameLoadingFinished");
export const gameplayStart = () => call("gameplayStart");
export const gameplayStop = () => call("gameplayStop");

// Runs a commercial break. onStart pauses and mutes; onEnd resumes. onEnd always runs.
export async function showAd(onStart, onEnd) {
  onStart();
  let timer;
  try {
    const brk = call("commercialBreak", onStart);
    if (brk && typeof brk.then === "function") {
      await Promise.race([brk, new Promise((resolve) => { timer = setTimeout(resolve, BREAK_TIMEOUT_MS); })]);
    }
  } catch (err) {
    // A failed break must not block play.
  } finally {
    clearTimeout(timer);
    onEnd();
  }
}
