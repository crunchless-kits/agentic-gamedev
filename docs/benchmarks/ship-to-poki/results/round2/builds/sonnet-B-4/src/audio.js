// Audio is optional: a missing file or a blocked play() must never break the game.
function make(src) {
  try { return new Audio(src); } catch (e) { return null; }
}
const music = make("assets/music.wav");
if (music) music.loop = true;
const sounds = { jump: make("assets/jump.wav"), gem: make("assets/gem.wav") };
let muted = false;

function tryPlay(a) {
  try { const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
}

export function startMusic() {
  if (music && !muted) tryPlay(music);
}

export function setMuted(m) {
  muted = m;
  if (!music) return;
  if (m) music.pause(); else tryPlay(music);
}

export function play(name) {
  const s = sounds[name];
  if (!s || muted) return;
  try { s.currentTime = 0; } catch (e) { /* ignore */ }
  tryPlay(s);
}
