const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;

function safePlay(a) {
  if (muted) return;
  try { a.play()?.catch(() => {}); } catch (e) {}
}

// Browsers block audio until a user gesture; call this from input handlers.
export function startMusic() {
  safePlay(music);
}

export function setMuted(m) {
  muted = m;
  if (m) music.pause(); else safePlay(music);
}

export function play(name) {
  const s = sounds[name];
  if (!s) return;
  s.currentTime = 0;
  safePlay(s);
}
