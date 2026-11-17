export const keys = {};

const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

// Binds keyboard and touch once. onInput fires on any player input. onJump
// fires on jump keys and on a tap in the middle of the canvas. Touch on the
// left or right side holds a move key while the finger is down.
export function bindInput(canvas, { onJump, onInput }) {
  window.addEventListener("keydown", (e) => {
    if (GAME_KEYS.has(e.key)) e.preventDefault(); // keep the page from scrolling
    keys[e.key] = true;
    onInput();
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w") onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
  window.addEventListener("blur", () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

  let touchHeld = null;
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    onInput();
    const r = canvas.getBoundingClientRect();
    const f = (e.clientX - r.left) / r.width;
    if (f < 0.35) touchHeld = "ArrowLeft";
    else if (f > 0.65) touchHeld = "ArrowRight";
    else { touchHeld = null; onJump(); }
    if (touchHeld) keys[touchHeld] = true;
  });
  const release = () => {
    if (touchHeld) keys[touchHeld] = false;
    touchHeld = null;
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
}
