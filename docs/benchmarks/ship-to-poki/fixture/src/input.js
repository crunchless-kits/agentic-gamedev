export const keys = {};

export function bindKeys(onJump) {
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w") onJump();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
}
