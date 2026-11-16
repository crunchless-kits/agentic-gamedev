const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

// Autoplay rules and missing or blocked files must not break the game loop.
const quietly = (p) => { if (p && p.catch) p.catch(() => {}); };

export function startMusic() {
  quietly(music.play());
}

export function play(name) {
  const s = sounds[name];
  s.currentTime = 0;
  quietly(s.play());
}

// Poki requires game audio to be muted while an ad plays.
export function setMuted(muted) {
  music.muted = muted;
  for (const s of Object.values(sounds)) s.muted = muted;
}
