const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

let wantMusic = false;
let paused = false;

function tryPlay(a) {
  const p = a.play();
  if (p && p.catch) p.catch(() => {}); // autoplay blocked: retry on next gesture
}

// Call from a user gesture only.
export function startMusic() {
  wantMusic = true;
  if (!paused) tryPlay(music);
}

// Pause everything (ad break, hidden tab) and restore afterwards.
export function setPaused(p) {
  paused = p;
  if (p) music.pause();
  else if (wantMusic) tryPlay(music);
}

export function play(name) {
  if (paused) return;
  const s = sounds[name];
  s.currentTime = 0;
  tryPlay(s);
}
