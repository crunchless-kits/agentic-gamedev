export const keys = {};

const GAME_KEYS = [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"];

// Call once at startup. onJump fires on jump input; onAnyInput fires on the
// first key press or tap (used to start audio after a user gesture).
export function bindInput(onJump, onAnyInput) {
  window.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (GAME_KEYS.includes(k)) e.preventDefault(); // keep space/arrows from scrolling the page
    keys[k] = true;
    onAnyInput();
    if (!e.repeat && (k === " " || k === "ArrowUp" || k === "w")) onJump();
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = false;
  });
  window.addEventListener("pointerdown", () => {
    onAnyInput();
    onJump();
  });
  // Releasing keys while focus is elsewhere would otherwise leave them stuck down.
  window.addEventListener("blur", () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
}
