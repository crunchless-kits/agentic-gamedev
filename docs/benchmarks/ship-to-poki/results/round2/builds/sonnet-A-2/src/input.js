export const keys = {};
const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
let bound = false;

export function bindKeys(onJump) {
  if (bound) return;
  bound = true;
  window.addEventListener("keydown", (e) => {
    if (GAME_KEYS.has(e.key)) e.preventDefault(); // stop the portal page scrolling
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = true;
    if (!e.repeat && (k === " " || k === "ArrowUp" || k === "w")) onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
  });
  window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });
}
