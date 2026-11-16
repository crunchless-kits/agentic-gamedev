const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;

const tryPlay = (a) => { const p = a.play(); if (p && p.catch) p.catch(() => {}); };

export function setMuted(m) {
  muted = m;
  music.muted = m;
  for (const s of Object.values(sounds)) s.muted = m;
}

// Browsers block audio before a user gesture; call this from an input handler.
export function startMusic() {
  if (!muted) tryPlay(music);
}

export function play(name) {
  if (muted) return;
  const s = sounds[name];
  s.currentTime = 0;
  tryPlay(s);
}
