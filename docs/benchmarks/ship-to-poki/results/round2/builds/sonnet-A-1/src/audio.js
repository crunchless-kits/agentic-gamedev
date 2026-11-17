const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;

function tryPlay(a) {
  const p = a.play();
  if (p && p.catch) p.catch(() => {});
}

export function startMusic() {
  if (!muted) tryPlay(music);
}

export function setMuted(m) {
  muted = m;
  music.muted = m;
  for (const s of Object.values(sounds)) s.muted = m;
  if (!m && music.paused) tryPlay(music);
}

export function play(name) {
  const s = sounds[name];
  if (!s || muted) return;
  s.currentTime = 0;
  tryPlay(s);
}
