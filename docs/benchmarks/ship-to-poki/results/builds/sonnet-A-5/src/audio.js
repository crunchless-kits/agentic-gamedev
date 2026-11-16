const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;

const safePlay = (a) => { try { const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} };

export function startMusic() {
  if (!muted) safePlay(music);
}

export function setMuted(m) {
  muted = m;
  music.muted = m;
  for (const s of Object.values(sounds)) s.muted = m;
  if (!m && music.paused && music.currentTime > 0) safePlay(music);
}

export function play(name) {
  const s = sounds[name];
  if (!s || muted) return;
  s.currentTime = 0;
  safePlay(s);
}
