export const keys = {};
const BLOCKED = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
let enabled = true;
let onJump = () => {};
let onInput = () => {};
let bound = false;

export function setInputEnabled(on) {
  enabled = on;
  if (!on) for (const k in keys) keys[k] = false;
}

// Bind once at boot. `jump` is called on a jump press, `anyInput` on every first press.
export function bindInput(canvas, jump, anyInput) {
  onJump = jump;
  onInput = anyInput;
  if (bound) return;
  bound = true;
  window.addEventListener("keydown", (e) => {
    if (BLOCKED.has(e.key)) e.preventDefault();
    if (!enabled) return;
    keys[e.key] = true;
    onInput();
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w") onJump();
  });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
  window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });

  // Touch / mouse: left third = left, right third = right, middle = jump.
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (!enabled) return;
    const r = canvas.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    onInput();
    if (fx < 1 / 3) keys.ArrowLeft = true;
    else if (fx > 2 / 3) keys.ArrowRight = true;
    else onJump();
  });
  const release = () => { keys.ArrowLeft = false; keys.ArrowRight = false; };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
}
