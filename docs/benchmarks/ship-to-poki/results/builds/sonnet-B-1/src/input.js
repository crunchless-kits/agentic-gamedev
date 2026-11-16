export const keys = {};

const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowLeft", "ArrowRight", "ArrowDown"]);

// Call once. Keyboard plus touch: left third = left, right third = right, middle = jump.
export function bindInput(canvas, onJump, onFirstInput) {
  window.addEventListener("keydown", (e) => {
    if (GAME_KEYS.has(e.key)) e.preventDefault(); // stop page scroll inside the portal iframe
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = true;
    onFirstInput();
    if (!e.repeat && (k === " " || k === "ArrowUp" || k === "w")) onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
  });
  window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });

  const touches = new Map();
  const apply = () => {
    const zones = [...touches.values()];
    keys.ArrowLeft = zones.includes("l");
    keys.ArrowRight = zones.includes("r");
  };
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    onFirstInput();
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const zone = x < 1 / 3 ? "l" : x > 2 / 3 ? "r" : "m";
    touches.set(e.pointerId, zone);
    if (zone === "m") onJump();
    apply();
  });
  const up = (e) => { touches.delete(e.pointerId); apply(); };
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
}
