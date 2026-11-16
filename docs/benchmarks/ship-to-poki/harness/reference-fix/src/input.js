export const held = { left: false, right: false };
const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export function clearHeld() { held.left = false; held.right = false; }

// Bound once at boot. Keyboard, plus touch: left third moves left, right third moves right, middle jumps.
export function bindInput(canvas, onAction) {
  window.addEventListener("keydown", (e) => {
    if (GAME_KEYS.has(e.key)) e.preventDefault();
    if (e.repeat) return;
    if (e.key === "ArrowLeft" || e.key === "a") held.left = true;
    if (e.key === "ArrowRight" || e.key === "d") held.right = true;
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w") onAction();
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") held.left = false;
    if (e.key === "ArrowRight" || e.key === "d") held.right = false;
  });
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (x < 1 / 3) held.left = true; else if (x > 2 / 3) held.right = true; else onAction();
  });
  const up = () => clearHeld();
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  window.addEventListener("blur", up);
}
