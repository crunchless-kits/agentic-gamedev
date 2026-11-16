export const keys = {};
const BLOCK = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
let bound = false;

// Safe to call more than once; listeners are only attached the first time.
export function bindKeys(onJump) {
  if (bound) return;
  bound = true;
  window.addEventListener("keydown", (e) => {
    if (BLOCK.has(e.key)) e.preventDefault(); // stop the portal page scrolling
    keys[e.key] = true;
    if (!e.repeat && (e.key === " " || e.key === "ArrowUp" || e.key === "w")) onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
  });
}
