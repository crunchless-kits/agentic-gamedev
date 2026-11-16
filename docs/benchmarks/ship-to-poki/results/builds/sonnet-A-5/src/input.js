export const keys = {};
const GAME_KEYS = [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

export function bindKeys(onJump, onFirstInput) {
  window.addEventListener("keydown", (e) => {
    if (GAME_KEYS.includes(e.key)) e.preventDefault(); // stop page scrolling in the portal iframe
    onFirstInput && onFirstInput();
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = true;
    if (!e.repeat && (k === " " || k === "ArrowUp" || k === "w")) onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
  });
  window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });
}
