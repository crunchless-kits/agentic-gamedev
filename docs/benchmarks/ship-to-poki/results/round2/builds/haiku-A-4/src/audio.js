const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

// Browsers block autoplay until the user interacts, so play() can reject.
// Rejections are swallowed; audio simply starts on a later attempt.
export function startMusic() {
  music.play().catch(() => {});
}

export function pauseMusic() {
  music.pause();
}

export function play(name) {
  const s = sounds[name];
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}
