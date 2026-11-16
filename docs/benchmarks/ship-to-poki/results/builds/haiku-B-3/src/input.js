export const keys = {};
export const touch = { left: false, right: false };

const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export function bindKeys(onJump) {
  window.addEventListener("keydown", (e) => {
    // Stop arrows and space from scrolling the page inside the portal frame.
    if (GAME_KEYS.has(e.key)) e.preventDefault();
    keys[e.key] = true;
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w") onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
  // Keys held when focus leaves would otherwise stay stuck down.
  window.addEventListener("blur", () => {
    for (const k of Object.keys(keys)) keys[k] = false;
    touch.left = false;
    touch.right = false;
  });
}

// Touch and mouse: left third moves left while held, right third moves right
// while held, and a press in the middle third jumps (or restarts after game over).
export function bindTouch(canvas, onJump) {
  const pointers = new Map(); // pointerId -> "left" | "right" | "jump"

  const zoneAt = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (x < 1 / 3) return "left";
    if (x > 2 / 3) return "right";
    return "jump";
  };

  const refresh = () => {
    const zones = [...pointers.values()];
    touch.left = zones.includes("left");
    touch.right = zones.includes("right");
  };

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const zone = zoneAt(e);
    pointers.set(e.pointerId, zone);
    if (zone === "jump") onJump();
    refresh();
  });

  const release = (e) => {
    pointers.delete(e.pointerId);
    refresh();
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", release);
}
