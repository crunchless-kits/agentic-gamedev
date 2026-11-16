// Keyboard and touch input. Keys are stored lowercase for letters ("a", "d", "w").
export const keys = {};

// Touch: -1 while a finger holds the left half of the canvas, 1 for the right half, 0 otherwise.
export const touch = { dir: 0 };

const JUMP_KEYS = [" ", "arrowup", "w"];
const GAME_KEYS = [" ", "arrowup", "arrowleft", "arrowright", "a", "d", "w"];

export function bindInput({ onJump, onFirstInput }) {
  const canvas = document.getElementById("game");
  let firstInputSeen = false;
  const firstInput = () => {
    if (firstInputSeen) return;
    firstInputSeen = true;
    onFirstInput();
  };

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (GAME_KEYS.includes(k)) e.preventDefault(); // stop arrows and space from scrolling the page
    firstInput();
    keys[k] = true;
    if (!e.repeat && JUMP_KEYS.includes(k)) onJump();
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  // Blur fires when the player alt-tabs; clear held keys so the player does not keep drifting.
  window.addEventListener("blur", () => {
    for (const k of Object.keys(keys)) keys[k] = false;
    touch.dir = 0;
  });

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    firstInput();
    const r = canvas.getBoundingClientRect();
    touch.dir = e.clientX < r.left + r.width / 2 ? -1 : 1;
    onJump();
  });
  const release = () => {
    touch.dir = 0;
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", release);
}
