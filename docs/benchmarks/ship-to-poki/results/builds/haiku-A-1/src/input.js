export const keys = {};

// Held state for touch: left/right third of the canvas.
export const touch = { left: false, right: false };

const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowLeft", "ArrowRight", "w", "a", "d", "Escape"]);

const norm = (k) => (k.length === 1 ? k.toLowerCase() : k);

export function bindInput({ onJump, onMove, onPause }) {
  window.addEventListener("keydown", (e) => {
    const k = norm(e.key);
    if (GAME_KEYS.has(e.key)) e.preventDefault(); // keep space/arrows from scrolling the page
    keys[k] = true;
    if (e.repeat) return;
    if (k === "Escape") onPause();
    else if (k === " " || k === "ArrowUp" || k === "w") onJump();
    else if (k === "ArrowLeft" || k === "ArrowRight" || k === "a" || k === "d") onMove();
  });
  window.addEventListener("keyup", (e) => {
    keys[norm(e.key)] = false;
  });
}

// Touch and mouse: left third = hold left, right third = hold right,
// middle third tap = jump.
export function bindTouch(canvas, { onJump, onMove }) {
  const canvasX = (e) => {
    const r = canvas.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * canvas.width;
  };
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const x = canvasX(e);
    if (x < canvas.width / 3) { touch.left = true; onMove(); }
    else if (x > (canvas.width * 2) / 3) { touch.right = true; onMove(); }
    else onJump();
  });
  const release = () => { touch.left = false; touch.right = false; };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", release);
}
