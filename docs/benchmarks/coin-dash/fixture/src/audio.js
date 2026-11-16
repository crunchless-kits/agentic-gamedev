const music = new Audio("assets/music.mp3");
music.loop = true;
const coin = new Audio("assets/coin.wav");

export function playMusic() {
  music.play();
}

export function playCoin() {
  coin.currentTime = 0;
  coin.play();
}
