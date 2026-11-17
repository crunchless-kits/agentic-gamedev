const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
const all = [music, ...Object.values(sounds)];

// Browsers only allow audio after a user gesture, so this is called from key handlers.
export function startMusic() {
  if (music.paused) music.play().catch(() => {});
}

export function setMuted(muted) {
  for (const a of all) a.muted = muted;
}

export function play(name) {
  const s = sounds[name];
  s.currentTime = 0;
  s.play().catch(() => {});
}
