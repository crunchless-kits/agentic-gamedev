export const keys = {};

const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

// Stop arrow keys and space from scrolling the page inside the Poki iframe.
export function bindKeys(onJump) {
  window.addEventListener("keydown", (e) => {
    if (GAME_KEYS.has(e.key)) e.preventDefault();
    keys[e.key] = true;
    if (!e.repeat && (e.key === " " || e.key === "ArrowUp" || e.key === "w")) onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
  // Releasing keys while the tab is switched away would otherwise leave them stuck.
  window.addEventListener("blur", () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
}
