export const keys = {};
export const touch = { left: false, right: false };

const GAME_KEYS = [" ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

export function bindKeys(onAction, onPause) {
  window.addEventListener("keydown", (e) => {
    // Keep arrows and space from scrolling the page around the game.
    if (GAME_KEYS.includes(e.key)) e.preventDefault();
    keys[e.key] = true;
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w") onAction();
    if (e.key === "p" || e.key === "P") onPause();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
    touch.left = false;
    touch.right = false;
  });
}

// Left and right thirds of the canvas hold to move; the middle taps to jump or start.
export function bindTouch(canvas, onTap) {
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const x = e.offsetX / canvas.clientWidth;
    const zone = x < 0.3 ? "left" : x > 0.7 ? "right" : "mid";
    if (zone === "left") touch.left = true;
    if (zone === "right") touch.right = true;
    onTap(zone);
  });
  const release = () => {
    touch.left = false;
    touch.right = false;
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", release);
}
