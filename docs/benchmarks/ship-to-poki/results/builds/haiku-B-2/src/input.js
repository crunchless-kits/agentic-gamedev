export const keys = {};

// Keys that would otherwise scroll the page inside the portal iframe.
const PAGE_KEYS = [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

export function bindKeys(onJump) {
  window.addEventListener("keydown", (e) => {
    if (PAGE_KEYS.includes(e.key)) e.preventDefault();
    keys[e.key] = true;
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w") onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
}

// Touch: hold the left third to move left, the right third to move right, tap the middle to jump.
export function bindTouch(canvas, onJump) {
  const release = () => { keys.ArrowLeft = false; keys.ArrowRight = false; };
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const zone = e.offsetX / canvas.clientWidth;
    if (zone < 1 / 3) keys.ArrowLeft = true;
    else if (zone > 2 / 3) keys.ArrowRight = true;
    else onJump();
  });
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", release);
}
