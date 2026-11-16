// Audio files are in assets/. Relative paths keep the build working from any folder.
const music = new Audio("assets/music.wav");
music.loop = true;
music.preload = "none"; // do not pull the soundtrack during loading
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

function warn(err) {
  console.warn("audio:", err);
}

export function startMusic() {
  music.play().catch(warn);
}

export function setMuted(muted) {
  music.muted = muted;
  for (const s of Object.values(sounds)) s.muted = muted;
}

export function play(name) {
  const s = sounds[name];
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(warn);
}
