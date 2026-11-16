const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

// Browsers block autoplay until the player interacts, so this is safe to call
// on every input event; it only starts playback if nothing is playing yet.
export function startMusic() {
  if (!music.paused) return;
  music.play().catch(() => {});
}

export function setMuted(muted) {
  music.muted = muted;
  for (const s of Object.values(sounds)) s.muted = muted;
}

export function play(name) {
  const s = sounds[name];
  s.currentTime = 0;
  s.play().catch(() => {});
}
