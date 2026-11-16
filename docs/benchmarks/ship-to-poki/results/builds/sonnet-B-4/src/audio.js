const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

let muted = false;
let musicWanted = false;

// Browsers block play() before a user gesture, so call this from an input handler.
export function startMusic() {
  musicWanted = true;
  if (!muted) music.play().catch(() => {});
}

export function setMuted(value) {
  muted = value;
  if (muted) music.pause();
  else if (musicWanted) music.play().catch(() => {});
}

export function play(name) {
  if (muted) return;
  const s = sounds[name];
  s.currentTime = 0;
  s.play().catch(() => {});
}
