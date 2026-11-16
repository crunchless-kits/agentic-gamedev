export const keys = {};

const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

// onAction runs on jump/start/restart keys. Held keys are tracked in `keys`.
export function bindKeys(onAction) {
  window.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = true;
    if (GAME_KEYS.has(e.key)) e.preventDefault(); // stop the page scrolling
    if (e.repeat) return;
    if (k === " " || k === "ArrowUp" || k === "w") onAction();
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = false;
  });
  // Avoid stuck movement when focus leaves the window.
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
  });
}
