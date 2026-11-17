// Keyboard and pointer input. Reports actions to the game once per press and
// keeps "held" state for movement. Listeners are bound once, at boot.

const LEFT = new Set(["ArrowLeft", "a", "A"]);
const RIGHT = new Set(["ArrowRight", "d", "D"]);
const JUMP = new Set([" ", "ArrowUp", "w", "W"]);
const PREVENT_SCROLL = new Set([" ", "ArrowUp", "ArrowDown"]);

const keyHeld = { left: false, right: false };
const touchHeld = { left: false, right: false };
const pointerSide = new Map(); // pointerId -> "left" | "right" | null

export function isHeld(dir) {
  return keyHeld[dir] || touchHeld[dir];
}

function refreshTouch() {
  touchHeld.left = false;
  touchHeld.right = false;
  for (const side of pointerSide.values()) if (side) touchHeld[side] = true;
}

function releaseKeys() {
  keyHeld.left = false;
  keyHeld.right = false;
  pointerSide.clear();
  refreshTouch();
}

// onPress(action): action is "left", "right", or "jump".
export function bindInput(canvas, onPress) {
  window.addEventListener("keydown", (e) => {
    if (PREVENT_SCROLL.has(e.key)) e.preventDefault();
    if (LEFT.has(e.key)) { keyHeld.left = true; onPress("left"); }
    else if (RIGHT.has(e.key)) { keyHeld.right = true; onPress("right"); }
    else if (JUMP.has(e.key)) onPress("jump");
  });
  window.addEventListener("keyup", (e) => {
    if (LEFT.has(e.key)) keyHeld.left = false;
    if (RIGHT.has(e.key)) keyHeld.right = false;
  });
  window.addEventListener("blur", releaseKeys);
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

  // Touch: left third holds left, right third holds right, center taps jump.
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const f = (e.clientX - r.left) / r.width;
    const side = f < 1 / 3 ? "left" : f > 2 / 3 ? "right" : null;
    pointerSide.set(e.pointerId, side);
    refreshTouch();
    onPress(side || "jump");
  });
  const release = (e) => {
    pointerSide.delete(e.pointerId);
    refreshTouch();
  };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
}
