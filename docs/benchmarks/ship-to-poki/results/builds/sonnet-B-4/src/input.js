export const keys = {};

const BLOCKED = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
let enabled = true;

// Disabled during ad breaks (Poki requires keyboard input off while an ad runs).
export function setInputEnabled(value) {
  enabled = value;
  if (!value) for (const k in keys) keys[k] = false;
}

const norm = (k) => (k.length === 1 ? k.toLowerCase() : k);

// Call once. onInput fires on every keydown; onJump on jump keys.
export function bindKeys(onJump, onInput) {
  window.addEventListener("keydown", (e) => {
    // Stop the portal page from scrolling on arrows and space.
    if (BLOCKED.has(e.key)) e.preventDefault();
    if (!enabled) return;
    const k = norm(e.key);
    keys[k] = true;
    if (onInput) onInput();
    if (!e.repeat && (k === " " || k === "ArrowUp" || k === "w")) onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[norm(e.key)] = false;
  });
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
  });
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
}
