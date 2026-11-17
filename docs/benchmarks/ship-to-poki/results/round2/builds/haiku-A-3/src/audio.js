const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

// Poki requires audio to be off during commercial breaks.
let muted = false;

export function setMuted(value) {
  muted = value;
  music.muted = value;
  for (const s of Object.values(sounds)) s.muted = value;
}

export function startMusic() {
  // Autoplay can be refused until the player interacts; that is not an error.
  music.play().catch(() => {});
}

export function play(name) {
  const s = sounds[name];
  if (!s || muted) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}
