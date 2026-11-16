export const keys = {};
const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
let bound = false;

// Safe to call more than once: listeners are only attached the first time.
export function bindKeys(onJump, onAnyInput) {
  if (bound) return;
  bound = true;
  window.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (GAME_KEYS.has(k)) e.preventDefault(); // stop the portal page from scrolling
    onAnyInput?.();
    if (e.repeat) { keys[k] = true; return; }
    keys[k] = true;
    if (k === " " || k === "ArrowUp" || k === "w") onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
  });
  window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });
}
