export const keys = {};

const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

function normalize(key) {
  return key.length === 1 ? key.toLowerCase() : key;
}

export function bindKeys(onJump) {
  window.addEventListener("keydown", (e) => {
    // Stop the page from scrolling while playing.
    if (GAME_KEYS.has(e.key)) e.preventDefault();
    const k = normalize(e.key);
    keys[k] = true;
    if (k === " " || k === "ArrowUp" || k === "w") onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[normalize(e.key)] = false;
  });
}
