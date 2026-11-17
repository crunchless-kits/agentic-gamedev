export const keys = {};
const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
let bound = false;

export function bindKeys(onJump, onFirstInput) {
  if (bound) return;
  bound = true;
  window.addEventListener("keydown", (e) => {
    if (GAME_KEYS.has(e.key)) e.preventDefault(); // stop page scrolling inside the portal iframe
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = true;
    onFirstInput?.();
    if (e.repeat) return;
    if (k === " " || k === "ArrowUp" || k === "w") onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
  });
  window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });
}
