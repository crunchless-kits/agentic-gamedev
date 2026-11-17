// Poki adapter: the only module that touches PokiSDK. Every call is safe when the SDK
// script is blocked, fails to init, or throws, so the game keeps running without it.
// Method names come from the verified Poki notes (poki-integration/references/poki-sdk-notes.md).

const AD_TIMEOUT_MS = 20000;   // fallback: resume if the break's completion never arrives
const INIT_TIMEOUT_MS = 5000;  // fallback: load the game if init never settles

function sdk() {
  return typeof window !== "undefined" ? window.PokiSDK : undefined;
}

function call(name, ...args) {
  try {
    const s = sdk();
    if (s && typeof s[name] === "function") return s[name](...args);
  } catch (e) {
    // SDK failure must not stop the game.
  }
  return undefined;
}

// Resolves when the promise settles or the timeout passes, whichever comes first. Never rejects.
function settleOrTimeout(promise, ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    Promise.resolve(promise).then(
      () => { clearTimeout(timer); resolve(); },
      () => { clearTimeout(timer); resolve(); }
    );
  });
}

export function initSdk() {
  return settleOrTimeout(call("init"), INIT_TIMEOUT_MS);
}

export function gameLoadingFinished() {
  call("gameLoadingFinished");
}

export function gameplayStart() {
  call("gameplayStart");
}

export function gameplayStop() {
  call("gameplayStop");
}

// Calls onStart when the break begins (pause and mute there). Resolves when the break is over.
// With no SDK there is no ad, so it resolves at once.
export function commercialBreak(onStart) {
  if (!sdk()) return Promise.resolve();
  return settleOrTimeout(call("commercialBreak", onStart), AD_TIMEOUT_MS);
}
