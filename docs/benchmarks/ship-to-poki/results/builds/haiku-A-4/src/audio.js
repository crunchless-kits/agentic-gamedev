const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

let muted = false;

// Browsers block audio until a user gesture, so call this from input handling.
export function startMusic() {
  if (muted || !music.paused) return;
  music.play().catch(() => {});
}

export function setMuted(value) {
  muted = value;
  music.muted = value;
  for (const s of Object.values(sounds)) s.muted = value;
}

export function play(name) {
  if (muted) return;
  const s = sounds[name];
  s.currentTime = 0;
  s.play().catch(() => {});
}
