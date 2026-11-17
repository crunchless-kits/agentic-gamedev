export const keys = {};

const JUMP_KEYS = new Set([" ", "ArrowUp", "w"]);
const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

// Call once. Letters are normalised to lowercase so Shift/CapsLock still work.
export function bindKeys(onJump) {
  window.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = true;
    if (GAME_KEYS.has(k)) e.preventDefault(); // stop the page scrolling
    if (JUMP_KEYS.has(k) && !e.repeat) onJump();
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = false;
  });
  // Avoid stuck movement keys when focus leaves the window.
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
  });
}
