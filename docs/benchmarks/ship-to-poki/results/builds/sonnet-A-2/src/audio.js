const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;

function safePlay(a) {
  try { a.play()?.catch(() => {}); } catch (e) {}
}

// Must be called from a user gesture (browsers block autoplay otherwise).
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
