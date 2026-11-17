const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
const all = [music, ...Object.values(sounds)];

// Browsers block autoplay until the first user gesture; rejections are ignored
// so a blocked or missing file never throws an uncaught error.
export function startMusic() {
  music.play().catch(() => {});
}

export function play(name) {
  const s = sounds[name];
  s.currentTime = 0;
  s.play().catch(() => {});
}

export function setMuted(muted) {
  for (const a of all) a.muted = muted;
}
