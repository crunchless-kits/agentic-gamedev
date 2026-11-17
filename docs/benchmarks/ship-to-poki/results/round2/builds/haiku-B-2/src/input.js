// Held-key and pointer state, read by the game loop.
export const keys = {};

const JUMP_KEYS = new Set([" ", "ArrowUp", "w"]);
// Keys that scroll the host page in an embed. Poki asks for these to be blocked.
const PAGE_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

function normalize(key) {
  return key.length === 1 ? key.toLowerCase() : key;
}

// Bind once at boot. onAction runs on a jump key press or a tap. Auto-repeat is ignored.
export function bindInput(canvas, onAction) {
  window.addEventListener("keydown", (e) => {
    if (PAGE_KEYS.has(e.key)) e.preventDefault();
    const k = normalize(e.key);
    keys[k] = true;
    if (!e.repeat && JUMP_KEYS.has(k)) onAction();
  });

  window.addEventListener("keyup", (e) => {
    keys[normalize(e.key)] = false;
  });

  // Keys can get stuck when focus leaves the page.
  window.addEventListener("blur", () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });

  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

  // Touch and mouse: the left half of the canvas moves left, the right half moves right, and any press jumps.
  const setSide = (e) => {
    const r = canvas.getBoundingClientRect();
    const right = e.clientX - r.left >= r.width / 2;
    keys.left = !right;
    keys.right = right;
  };
  const release = () => {
    keys.left = false;
    keys.right = false;
  };
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    setSide(e);
    onAction();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.buttons || e.pointerType === "touch") setSide(e);
  });
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", release);
}
