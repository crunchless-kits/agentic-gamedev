export const keys = {};
let bound = false;
const BLOCK = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export function bindKeys(onJump, onFirstInput) {
  if (bound) return;
  bound = true;
  window.addEventListener("keydown", (e) => {
    if (BLOCK.has(e.key)) e.preventDefault(); // stop page scroll inside the portal iframe
    if (onFirstInput) onFirstInput();
    keys[e.key] = true;
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w") onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
  });
}
