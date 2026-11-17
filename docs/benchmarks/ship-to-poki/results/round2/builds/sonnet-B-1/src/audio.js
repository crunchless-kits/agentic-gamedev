const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;
let musicWanted = false;

function tryPlay(a) {
  const p = a.play();
  if (p && p.catch) p.catch(() => {});
}

export function startMusic() {
  musicWanted = true;
  if (!muted) tryPlay(music);
}

export function setMuted(m) {
  muted = m;
  if (m) { music.pause(); for (const s of Object.values(sounds)) s.pause(); }
  else if (musicWanted) tryPlay(music);
}

export function play(name) {
  if (muted) return;
  const s = sounds[name];
  s.currentTime = 0;
  tryPlay(s);
}
