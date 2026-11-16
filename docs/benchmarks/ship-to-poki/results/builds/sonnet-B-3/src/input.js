export const keys = {};
let enabled = true;
const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export function setInputEnabled(v) {
  enabled = v;
  if (!v) for (const k in keys) keys[k] = false;
}

// Call once. onAction fires on any first input (start audio, gameplayStart).
export function bindInput(canvas, onJump, onAction) {
  window.addEventListener("keydown", (e) => {
    if (GAME_KEYS.has(e.key)) e.preventDefault(); // stop the portal page scrolling
    if (!enabled) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = true;
    onAction();
    if (!e.repeat && (k === " " || k === "ArrowUp" || k === "w")) onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
  });
  window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });

  // Touch: left third = left, right third = right, middle = jump.
  const zone = (t) => {
    const r = canvas.getBoundingClientRect();
    const f = (t.clientX - r.left) / r.width;
    return f < 0.33 ? "ArrowLeft" : f > 0.67 ? "ArrowRight" : "jump";
  };
  const sync = (e) => {
    e.preventDefault();
    if (!enabled) return;
    keys.ArrowLeft = keys.ArrowRight = false;
    for (const t of e.touches) { const z = zone(t); if (z !== "jump") keys[z] = true; }
  };
  canvas.addEventListener("touchstart", (e) => {
    sync(e);
    if (!enabled) return;
    onAction();
    for (const t of e.changedTouches) if (zone(t) === "jump") onJump();
  }, { passive: false });
  canvas.addEventListener("touchmove", sync, { passive: false });
  canvas.addEventListener("touchend", sync, { passive: false });
  canvas.addEventListener("touchcancel", sync, { passive: false });
}
