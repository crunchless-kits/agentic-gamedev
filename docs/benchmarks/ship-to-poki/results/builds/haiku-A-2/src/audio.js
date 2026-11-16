const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

export function setAudioMuted(muted) {
  music.muted = muted;
  for (const s of Object.values(sounds)) s.muted = muted;
}

// Browsers block audio until the player has interacted, so this is called on first input.
export function startMusic() {
  music.play().catch(() => {});
}

export function play(name) {
  const s = sounds[name];
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}
