export const keys = {};
const BLOCK = [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

export function bindKeys(onJump) {
  window.addEventListener("keydown", (e) => {
    if (BLOCK.includes(e.key)) e.preventDefault(); // stop portal page scrolling
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = true;
    if (k === " " || k === "ArrowUp" || k === "w") onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
  });
  window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });
}
