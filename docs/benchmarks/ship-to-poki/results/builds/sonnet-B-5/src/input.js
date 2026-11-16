export const keys = {};

const GAME_KEYS = [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
let bound = false;

// Bind once; handlers are shared by keyboard and touch.
export function bindKeys(onJump, onFirstInput) {
  if (bound) return;
  bound = true;
  window.addEventListener("keydown", (e) => {
    if (GAME_KEYS.includes(e.key)) e.preventDefault(); // stop the portal page scrolling
    onFirstInput?.();
    keys[e.key] = true;
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w") onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
  });

  // Touch: left third = left, right third = right, middle = jump.
  const canvas = document.getElementById("game");
  const zone = (e, t) => {
    const r = canvas.getBoundingClientRect();
    return (t.clientX - r.left) / r.width;
  };
  const apply = (e) => {
    e.preventDefault();
    onFirstInput?.();
    keys.ArrowLeft = keys.ArrowRight = false;
    for (const t of e.touches) {
      const z = zone(e, t);
      if (z < 0.33) keys.ArrowLeft = true;
      else if (z > 0.67) keys.ArrowRight = true;
    }
  };
  canvas.addEventListener("touchstart", (e) => {
    apply(e);
    const t = e.changedTouches[0];
    const z = zone(e, t);
    if (z >= 0.33 && z <= 0.67) onJump();
  }, { passive: false });
  canvas.addEventListener("touchmove", apply, { passive: false });
  canvas.addEventListener("touchend", apply, { passive: false });
  canvas.addEventListener("touchcancel", apply, { passive: false });
}
