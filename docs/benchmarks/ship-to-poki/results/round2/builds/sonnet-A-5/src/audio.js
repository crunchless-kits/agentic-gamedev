// Audio is created lazily so the large music file is not fetched at page load,
// and play() rejections (autoplay policy) are swallowed.
let music = null;
const sounds = {};
let muted = false;

function safePlay(a) {
  const p = a.play();
  if (p && p.catch) p.catch(() => {});
}

export function startMusic() {
  if (!music) {
    music = new Audio("assets/music.wav");
    music.loop = true;
  }
  music.muted = muted;
  if (music.paused) safePlay(music);
}

export function play(name) {
  if (muted) return;
  let s = sounds[name];
  if (!s) s = sounds[name] = new Audio(`assets/${name}.wav`);
  s.currentTime = 0;
  safePlay(s);
}

export function setMuted(m) {
  muted = m;
  if (music) music.muted = m;
}
