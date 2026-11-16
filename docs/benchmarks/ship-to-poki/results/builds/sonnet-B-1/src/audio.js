const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;
let musicWanted = false;

const quiet = (p) => { if (p && p.catch) p.catch(() => {}); };

// Browsers reject play() before a user gesture; call this from an input handler.
export function startMusic() {
  musicWanted = true;
  if (!muted) quiet(music.play());
}

export function setMuted(m) {
  muted = m;
  if (m) music.pause();
  else if (musicWanted) quiet(music.play());
}

export function play(name) {
  const s = sounds[name];
  if (muted || !s) return;
  s.currentTime = 0;
  quiet(s.play());
}
