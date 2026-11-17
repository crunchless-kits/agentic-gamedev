export const keys = {};

const PREVENT = [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

// Call once. onJump fires on jump keys; onAnyKey fires on every keydown.
export function bindKeys(onJump, onAnyKey) {
  window.addEventListener("keydown", (e) => {
    if (PREVENT.includes(e.key)) e.preventDefault();
    keys[e.key] = true;
    onAnyKey?.();
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w") onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
  // Avoid stuck movement when focus leaves the window.
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
  });
}
