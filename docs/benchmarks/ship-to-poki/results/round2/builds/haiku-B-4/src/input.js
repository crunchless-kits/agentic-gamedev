export const keys = {};

// Keys that scroll the page or that the game uses. Poki requires the page not to scroll.
const PAGE_KEYS = new Set([" ", "ArrowUp", "ArrowDown"]);
const JUMP_KEYS = new Set([" ", "ArrowUp", "w"]);

// onInput is called for every jump, restart, or start request (keyboard or touch).
export function bindInput(canvas, onInput) {
  window.addEventListener("keydown", (e) => {
    if (PAGE_KEYS.has(e.key)) e.preventDefault();
    keys[e.key] = true;
    if (!e.repeat && JUMP_KEYS.has(e.key)) onInput();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
  window.addEventListener("blur", () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

  // Touch and mouse: tap anywhere to jump; hold the left or right half to move.
  let held = null;
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const side = e.clientX - rect.left < rect.width / 2 ? "ArrowLeft" : "ArrowRight";
    held = side;
    keys[side] = true;
    onInput();
  });
  const release = () => {
    if (held) keys[held] = false;
    held = null;
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", release);
}
