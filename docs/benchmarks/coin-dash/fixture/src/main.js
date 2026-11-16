import { loadBest, saveBest } from "./save.js";
import { playMusic, playCoin } from "./audio.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let player, blocks, coins, score, best, over, keys;

function restart() {
  player = { x: 380, y: 540, w: 40, h: 40 };
  blocks = [];
  coins = [];
  score = 0;
  over = false;
  keys = {};
  best = loadBest();
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (over && e.key === " ") restart();
  });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });
}

function spawn() {
  if (Math.random() < 0.03) blocks.push({ x: Math.random() * 760, y: -40, w: 40, h: 40 });
  if (Math.random() < 0.02) coins.push({ x: Math.random() * 780, y: -20, w: 20, h: 20 });
}

function hit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  if (over) return;
  if (keys.ArrowLeft) player.x -= 6;
  if (keys.ArrowRight) player.x += 6;
  player.x = Math.max(0, Math.min(760, player.x));
  spawn();
  for (const b of blocks) b.y += 5;
  for (const c of coins) c.y += 4;
  for (const c of coins) if (hit(player, c)) { c.taken = true; score += 10; playCoin(); }
  coins = coins.filter((c) => !c.taken && c.y < 600);
  blocks = blocks.filter((b) => b.y < 600);
  if (blocks.some((b) => hit(player, b))) {
    over = true;
    if (score > best) { best = score; saveBest(best); }
  }
}

function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, 800, 600);
  ctx.fillStyle = "#6ee7a8";
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = "#e05555";
  for (const b of blocks) ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = "#f5c542";
  for (const c of coins) ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.fillStyle = "#fff";
  ctx.font = "20px sans-serif";
  ctx.fillText(`Score ${score}   Best ${best}`, 16, 30);
  if (over) ctx.fillText("Game over. Press space.", 300, 300);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

restart();
playMusic();
loop();
