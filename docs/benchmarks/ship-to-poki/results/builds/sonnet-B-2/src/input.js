export const keys = {};
let bound = false;
let enabled = true;

export function setInputEnabled(on) {
  enabled = on;
  if (!on) for (const k in keys) keys[k] = false;
}

// Safe to call more than once: listeners are attached a single time.
export function bindKeys(onJump) {
  if (bound) return;
  bound = true;
  const block = (e) => {
    if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
  };
  window.addEventListener("keydown", (e) => {
    block(e);
    if (!enabled) return;
    keys[e.key] = true;
    if (!e.repeat && (e.key === " " || e.key === "ArrowUp" || e.key === "w")) onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  // Touch: hold left/right thirds to move, tap the middle third to jump.
  const canvas = document.getElementById("game");
  const zone = (e) => {
    const r = canvas.getBoundingClientRect();
    const f = (e.clientX - r.left) / r.width;
    return f < 0.33 ? "left" : f > 0.67 ? "right" : "mid";
  };
  const clear = () => { keys.ArrowLeft = false; keys.ArrowRight = false; };
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" || !enabled) return;
    const z = zone(e);
    if (z === "left") keys.ArrowLeft = true;
    else if (z === "right") keys.ArrowRight = true;
    else onJump();
  });
  window.addEventListener("pointerup", clear);
  window.addEventListener("pointercancel", clear);
}
