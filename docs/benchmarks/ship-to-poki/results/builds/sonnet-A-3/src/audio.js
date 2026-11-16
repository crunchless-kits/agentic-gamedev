const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;
let wantMusic = false;

function safePlay(a) {
  try { const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
}

// Must be called from a user gesture (browsers block autoplay).
export function startMusic() {
  wantMusic = true;
  if (!muted) safePlay(music);
}

export function setMuted(m) {
  muted = m;
  music.muted = m;
  for (const s of Object.values(sounds)) s.muted = m;
  if (!m && wantMusic) safePlay(music);
}

export function play(name) {
  const s = sounds[name];
  if (!s || muted) return;
  s.currentTime = 0;
  safePlay(s);
}
