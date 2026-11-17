const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

let muted = false;
let wantMusic = false;

function tryPlay(a) {
  const p = a.play();
  if (p && p.catch) p.catch(() => {});
}

// Call from a user gesture (browsers block audio before one).
export function startMusic() {
  wantMusic = true;
  if (!muted) tryPlay(music);
}

export function setMuted(value) {
  muted = value;
  if (muted) music.pause();
  else if (wantMusic) tryPlay(music);
}

export function play(name) {
  const s = sounds[name];
  if (muted || !s) return;
  s.currentTime = 0;
  tryPlay(s);
}
