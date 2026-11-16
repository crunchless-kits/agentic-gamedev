const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;

// Ads require all game audio to be muted; the SDK's callback sets this.
export function setMuted(value) {
  muted = value;
  music.muted = value;
  for (const s of Object.values(sounds)) s.muted = value;
}

// Browsers reject play() before a user gesture; call this from input.
export function startMusic() {
  music.muted = muted;
  music.play().catch(() => {});
}

export function play(name) {
  if (muted) return;
  const s = sounds[name];
  s.currentTime = 0;
  s.play().catch(() => {});
}
