export const keys = {};

const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowLeft", "ArrowRight", "a", "d", "w"]);
const JUMP_KEYS = new Set([" ", "ArrowUp", "w"]);

// Letter keys are stored lowercase so Caps Lock / Shift do not break WASD.
function normalize(key) {
  return key.length === 1 ? key.toLowerCase() : key;
}

// Call once. onJump fires on jump keys and taps in the centre of the canvas;
// onInput fires on any key or touch (used to start audio after a user gesture).
// Touch: left 30% of the canvas holds left, right 30% holds right, centre taps jump.
export function bindInput(canvas, onJump, onInput) {
  window.addEventListener("keydown", (e) => {
    const k = normalize(e.key);
    if (GAME_KEYS.has(k)) e.preventDefault(); // stop the page scrolling on space/arrows
    keys[k] = true;
    onInput();
    if (JUMP_KEYS.has(k)) onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[normalize(e.key)] = false;
  });
  // Avoid keys sticking when focus leaves the window mid-press.
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
  });

  const release = () => {
    keys.a = false;
    keys.d = false;
  };
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    onInput();
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (x < 0.3) keys.a = true;
    else if (x > 0.7) keys.d = true;
    else onJump();
  });
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", release);
}
