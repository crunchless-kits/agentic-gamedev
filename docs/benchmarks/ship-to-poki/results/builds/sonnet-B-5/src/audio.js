const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;
let wantMusic = false;

function safePlay(a) {
  // Browsers reject play() before a user gesture or when the file is missing.
  const p = a.play();
  if (p && p.catch) p.catch(() => {});
}

// Call from a user gesture (first input); autoplay before that is blocked.
export function startMusic() {
  wantMusic = true;
  if (!muted) safePlay(music);
}

export function setMuted(m) {
  muted = m;
  if (m) music.pause();
  else if (wantMusic) safePlay(music);
}

export function play(name) {
  const s = sounds[name];
  if (!s || muted) return;
  s.currentTime = 0;
  safePlay(s);
}
