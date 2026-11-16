// Audio. Browsers block autoplay, so music starts on the player's first input (see main.js).
// Missing or blocked files fail quietly: the game plays silently rather than stopping.
const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
const all = [music, ...Object.values(sounds)];

let started = false;

function quiet(promise) {
  if (promise && typeof promise.catch === "function") promise.catch(() => {});
}

export function startMusic() {
  if (started) return;
  started = true;
  quiet(music.play());
}

export function play(name) {
  const s = sounds[name];
  if (!s) return;
  try {
    s.currentTime = 0;
  } catch (err) {
    // Source not ready yet; play from the start anyway.
  }
  quiet(s.play());
}

// Poki's commercial breaks require game audio to be silent while an ad plays.
export function setMuted(muted) {
  for (const a of all) a.muted = muted;
}
