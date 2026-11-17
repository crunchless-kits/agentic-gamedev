export const keys = {};
const GAME_KEYS = new Set([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"]);
let bound = false;

// Safe to call more than once; listeners are only attached the first time.
export function bindKeys(onJump) {
  if (bound) return;
  bound = true;
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (GAME_KEYS.has(k)) e.preventDefault(); // stop the portal page scrolling
    keys[k] = true;
    if (!e.repeat && (k === " " || k === "arrowup" || k === "w")) onJump();
  });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });
}
