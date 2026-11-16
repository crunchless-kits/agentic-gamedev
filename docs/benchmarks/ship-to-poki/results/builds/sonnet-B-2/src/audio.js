// Audio is created lazily and every play() is guarded: browsers reject play() before a user gesture,
// and the asset files may be missing or still loading.
let music = null;
const sounds = {};
let muted = false;

function get(name) {
  if (!sounds[name]) sounds[name] = new Audio(`assets/${name}.wav`);
  return sounds[name];
}

function safePlay(a) {
  if (muted) return;
  const p = a.play();
  if (p && p.catch) p.catch(() => {});
}

export function startMusic() {
  if (!music) {
    music = new Audio("assets/music.wav");
    music.loop = true;
  }
  safePlay(music);
}

export function play(name) {
  const s = get(name);
  s.currentTime = 0;
  safePlay(s);
}

// Used around ad breaks (Poki requires muting during ads).
export function setMuted(m) {
  muted = m;
  if (music) {
    if (m) music.pause();
    else music.play().catch(() => {});
  }
}
