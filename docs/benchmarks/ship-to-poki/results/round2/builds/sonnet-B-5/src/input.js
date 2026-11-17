export const keys = {};

const PREVENT = new Set(["ArrowUp", "ArrowDown", " "]);
let locked = false;
let bound = false;

// While locked (ad break) all game input is ignored.
export function setInputLocked(v) {
  locked = v;
  if (v) for (const k in keys) keys[k] = false;
}

// Bind once at boot. onInput(isJump) fires for every action input.
export function bindInput(canvas, onInput) {
  if (bound) return;
  bound = true;

  window.addEventListener("keydown", (e) => {
    if (PREVENT.has(e.key)) e.preventDefault(); // stop host page scrolling
    if (locked) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = true;
    if (!e.repeat) onInput(k === " " || k === "ArrowUp" || k === "w");
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = false;
  });
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

  // Touch / mouse: left third = left, right third = right, middle = jump.
  const zone = (e) => {
    const r = canvas.getBoundingClientRect();
    const f = (e.clientX - r.left) / r.width;
    return f < 0.33 ? "ArrowLeft" : f > 0.67 ? "ArrowRight" : "jump";
  };
  const held = new Map();
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (locked) return;
    const z = zone(e);
    if (z === "jump") { onInput(true); return; }
    held.set(e.pointerId, z);
    keys[z] = true;
    onInput(false);
  });
  const release = (e) => {
    const z = held.get(e.pointerId);
    if (z) { keys[z] = false; held.delete(e.pointerId); }
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
}
