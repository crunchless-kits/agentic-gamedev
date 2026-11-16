const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

export function startMusic() {
  music.play();
}

export function play(name) {
  const s = sounds[name];
  s.currentTime = 0;
  s.play();
}
