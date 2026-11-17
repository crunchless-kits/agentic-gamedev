export const keys = {};
const BLOCK = [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
let bound = false;
let enabled = true;

export function setInputEnabled(v) {
  enabled = v;
  if (!v) for (const k in keys) keys[k] = false;
}

// Bind once at boot. onKey fires on every accepted keydown; onJump on jump keys.
export function bindKeys(onJump, onAny) {
  if (bound) return;
  bound = true;
  window.addEventListener("keydown", (e) => {
    if (BLOCK.includes(e.key)) e.preventDefault();
    if (!enabled) return;
    if (onAny) onAny();
    keys[e.key] = true;
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w") onJump();
  });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
}
