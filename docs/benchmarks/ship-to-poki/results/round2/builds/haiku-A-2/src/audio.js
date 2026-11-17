const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

// Browsers reject play() before a user gesture and when a file is missing.
// Neither should break the game, so play() errors are swallowed.
function quietly(p) {
  if (p && typeof p.catch === "function") p.catch(() => {});
}

// Must be called from a user gesture (first key press or tap).
export function startMusic() {
  quietly(music.play());
}

export function setMuted(muted) {
  music.muted = muted;
  for (const s of Object.values(sounds)) s.muted = muted;
}

export function play(name) {
  const s = sounds[name];
  if (!s) return;
  s.currentTime = 0;
  quietly(s.play());
}
