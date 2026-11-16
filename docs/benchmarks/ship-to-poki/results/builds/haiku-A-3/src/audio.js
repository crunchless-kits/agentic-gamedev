const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

// Browsers reject autoplay and missing files with promises; neither should
// become an unhandled error that breaks the game.
function quietly(promise) {
  if (promise && typeof promise.catch === "function") promise.catch(() => {});
}

let muted = false;

export function startMusic() {
  if (!muted) quietly(music.play());
}

export function play(name) {
  const s = sounds[name];
  if (!s || muted) return;
  s.currentTime = 0;
  quietly(s.play());
}

// Used around Poki ad breaks: silence everything, then restore.
export function setMuted(value) {
  muted = value;
  music.muted = value;
  for (const s of Object.values(sounds)) s.muted = value;
  if (!value) quietly(music.play());
}
