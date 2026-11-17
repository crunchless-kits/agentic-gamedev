const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;

// play() rejects when autoplay is blocked or the file is missing; never let that surface.
const safePlay = (a) => { try { a.play()?.catch(() => {}); } catch (e) {} };

export function startMusic() {
  if (!muted) safePlay(music);
}

export function play(name) {
  if (muted) return;
  const s = sounds[name];
  s.currentTime = 0;
  safePlay(s);
}

export function setMuted(m) {
  muted = m;
  if (m) music.pause(); else safePlay(music);
}
