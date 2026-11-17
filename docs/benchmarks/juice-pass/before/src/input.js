export const keys = {};
const BLOCK = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
const JUMP = new Set([" ", "ArrowUp", "w"]);
let enabled = true;

export function setInputEnabled(on) {
  enabled = on;
  if (!on) for (const k in keys) keys[k] = false;
}

// Bind once at boot. onAction fires on any first input; onJump on a jump press.
export function bindInput(canvas, onAction, onJump) {
  window.addEventListener("keydown", (e) => {
    if (BLOCK.has(e.key)) e.preventDefault();
    if (!enabled) return;
    keys[e.key] = true;
    if (e.repeat) return;
    onAction();
    if (JUMP.has(e.key)) onJump();
  });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
  // Touch / mouse: left third = left, right third = right, middle = jump.
  const zone = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    return x < 0.33 ? "ArrowLeft" : x > 0.67 ? "ArrowRight" : null;
  };
  let held = null;
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (!enabled) return;
    onAction();
    held = zone(e);
    if (held) keys[held] = true; else onJump();
  });
  const release = () => { if (held) keys[held] = false; held = null; };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
}
