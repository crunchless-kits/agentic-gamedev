// Audio files are listed in assets/manifest.json. Playback errors (missing or blocked files) are ignored so gameplay never stops.
const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
const all = [music, ...Object.values(sounds)];

export function setMuted(muted) {
  for (const a of all) a.muted = muted;
}

// Browsers block autoplay until the player interacts, so call this from the first input.
export function startMusic() {
  music.play().catch(() => {});
}

export function play(name) {
  const s = sounds[name];
  s.currentTime = 0;
  s.play().catch(() => {});
}
