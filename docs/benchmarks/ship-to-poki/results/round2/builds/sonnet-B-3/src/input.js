export const keys = {};

const BLOCKED = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "]);
const norm = (k) => (k.length === 1 ? k.toLowerCase() : k);

// Bind once at boot. onJump fires on a jump key or a tap in the middle third.
// onAny fires on every key press or touch (first input starts play, restarts a run).
export function bindInput(canvas, { onJump, onAny }) {
  window.addEventListener("keydown", (e) => {
    if (BLOCKED.has(e.key)) e.preventDefault();
    const k = norm(e.key);
    keys[k] = true;
    if (e.repeat) return;
    onAny();
    if (k === " " || k === "ArrowUp" || k === "w") onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[norm(e.key)] = false;
  });
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
  window.addEventListener("blur", clearKeys);

  // Touch: left third moves left, right third moves right, middle third jumps.
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    clearKeys();
    onAny();
    if (fx < 1 / 3) keys.ArrowLeft = true;
    else if (fx > 2 / 3) keys.ArrowRight = true;
    else onJump();
  });
  const release = () => { keys.ArrowLeft = false; keys.ArrowRight = false; };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
}

export function clearKeys() {
  for (const k of Object.keys(keys)) keys[k] = false;
}
