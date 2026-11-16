const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

// Autoplay and missing files reject play() promises; the game must not break on them.
const quiet = (p) => { if (p && p.catch) p.catch(() => {}); };

export function startMusic() {
  quiet(music.play());
}

export function play(name) {
  const s = sounds[name];
  if (!s) return;
  s.currentTime = 0;
  quiet(s.play());
}

export function setMuted(muted) {
  music.muted = muted;
  for (const s of Object.values(sounds)) s.muted = muted;
}
