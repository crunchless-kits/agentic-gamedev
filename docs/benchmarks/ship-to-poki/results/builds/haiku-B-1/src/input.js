export const keys = {};

const GAME_KEYS = new Set([" ", "ArrowUp", "ArrowLeft", "ArrowRight", "Escape", "w", "a", "d"]);

// Keyboard: every game key goes through onInput(key). Calling bindKeys more than once would stack listeners, so call it once at boot.
export function bindKeys(onInput) {
  window.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (GAME_KEYS.has(key)) e.preventDefault(); // stops the page from scrolling on space and arrows
    keys[key] = true;
    onInput(key);
  });
  window.addEventListener("keyup", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[key] = false;
  });
  window.addEventListener("blur", () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
}

// Touch: the on-screen buttons in index.html are shown only on coarse pointers (phones, tablets).
export function bindTouch(onInput) {
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  const pad = document.getElementById("touch");
  pad.hidden = false;
  for (const btn of pad.querySelectorAll("button")) {
    const key = btn.dataset.key;
    const release = () => { keys[key] = false; };
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      keys[key] = true;
      onInput(key);
    });
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);
    btn.addEventListener("pointerleave", release);
  }
}
