// Missing or undecodable files fail quietly: the game plays without that sound.
const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;

export function startMusic() {
  if (!muted) music.play().catch(() => {});
}

export function play(name) {
  const s = sounds[name];
  if (!s || muted) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

export function setMuted(value) {
  muted = value;
  music.muted = value;
  for (const s of Object.values(sounds)) s.muted = value;
}
