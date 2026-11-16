// Audio is created lazily and every play() is guarded: browsers reject
// play() before a user gesture, and the portal can mute us during ads.
let music = null;
let sounds = null;
let muted = false;

function init() {
  if (music) return;
  music = new Audio("assets/music.wav");
  music.loop = true;
  music.preload = "none";
  music.muted = muted;
  sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
  for (const s of Object.values(sounds)) s.muted = muted;
}

export function startMusic() {
  init();
  music.play().catch(() => {});
}

export function setMuted(m) {
  muted = m;
  if (!music) return;
  music.muted = m;
  for (const s of Object.values(sounds)) s.muted = m;
}

export function play(name) {
  init();
  const s = sounds[name];
  s.currentTime = 0;
  s.play().catch(() => {});
}
