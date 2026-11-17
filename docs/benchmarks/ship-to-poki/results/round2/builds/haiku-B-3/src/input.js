export const keys = {};

// Keys that would scroll or otherwise act on the host page.
const PAGE_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export function bindKeys({ onJump, onInput }) {
  window.addEventListener("keydown", (e) => {
    if (PAGE_KEYS.has(e.key)) e.preventDefault();
    keys[e.key] = true;
    onInput();
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w") onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
  });
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
}

// Touch: left third of the canvas holds left, right third holds right, middle tap jumps.
export function bindTouch(canvas, { onJump, onInput }) {
  const active = new Map(); // pointerId -> key name
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    onInput();
    if (x < 1 / 3) {
      active.set(e.pointerId, "ArrowLeft");
      keys.ArrowLeft = true;
    } else if (x > 2 / 3) {
      active.set(e.pointerId, "ArrowRight");
      keys.ArrowRight = true;
    } else {
      onJump();
    }
  });
  const release = (e) => {
    const k = active.get(e.pointerId);
    if (k) {
      keys[k] = false;
      active.delete(e.pointerId);
    }
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
}
