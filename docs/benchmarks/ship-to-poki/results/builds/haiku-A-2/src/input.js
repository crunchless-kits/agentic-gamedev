export const keys = {};

const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

function normalize(key) {
  return key.length === 1 ? key.toLowerCase() : key;
}

// Call once at boot. onInput runs on every key press (used to start the Poki gameplay session).
export function bindKeys({ onInput, onJump, onPause }) {
  window.addEventListener("keydown", (e) => {
    const k = normalize(e.key);
    if (GAME_KEYS.has(k)) e.preventDefault(); // keep arrows and space from scrolling the page
    keys[k] = true;
    onInput();
    if (e.repeat) return;
    if (k === " " || k === "ArrowUp" || k === "w") onJump();
    if (k === "Escape") onPause();
  });
  window.addEventListener("keyup", (e) => {
    keys[normalize(e.key)] = false;
  });
  // Don't leave movement stuck if the window loses focus mid-key.
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
  });
}

// On-screen buttons for touch devices. Buttons carry data-key set to a keyboard key name.
export function bindTouch({ onInput, onJump }) {
  const pad = document.getElementById("touch");
  pad.hidden = !window.matchMedia("(pointer: coarse)").matches;
  for (const btn of pad.querySelectorAll("[data-key]")) {
    const k = btn.dataset.key;
    const release = () => { keys[k] = false; };
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      keys[k] = true;
      onInput();
      if (k === "ArrowUp") onJump();
    });
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);
    btn.addEventListener("pointerleave", release);
  }
}
