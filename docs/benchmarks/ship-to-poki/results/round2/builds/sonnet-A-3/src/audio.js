const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;

// Browsers block audio until a user gesture; call from an input handler and ignore rejection.
export function startMusic() {
  if (muted) return;
  music.play().catch(() => {});
}

export function setMuted(m) {
  muted = m;
  music.muted = m;
  for (const s of Object.values(sounds)) s.muted = m;
  if (!m && music.paused && started) startMusic();
}

let started = false;
export function ensureMusic() {
  if (started) return;
  started = true;
  startMusic();
}

export function play(name) {
  const s = sounds[name];
  if (!s || muted) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}
