import { initSdk, loadingFinished, gameplayStart, gameplayStop, showAd } from "./sdk.js";
import { startMusic, setMuted, play } from "./audio.js";
import { load, save } from "./save.js";
import { keys, bindInput, setInputEnabled } from "./input.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const STEP = 1000 / 60; // fixed simulation step (ms); tuning values are per step

let state, data = { best: 0, gems: 0 };
let started = false;   // first input received
let inBreak = false;   // ad break running: no input, no sim, no audio
let hidden = false;
let last = 0, acc = 0;

function newRun() {
  const islands = makeIslands();
  state = {
    player: { x: 60, y: 300, w: 28, h: 28, vy: 0, grounded: false },
    islands,
    gems: makeGems(islands),
    storms: makeStorms(),
    score: 0,
    over: false,
  };
}

function firstInput() {
  if (started || inBreak) return;
  started = true;
  startMusic();
  gameplayStart();
}

function jump() {
  if (inBreak) return;
  if (state.over) { restart(); return; }
  if (state.player.grounded) { state.player.vy = -11; state.player.grounded = false; play("jump"); }
}

async function restart() {
  if (inBreak) return;
  inBreak = true;
  setInputEnabled(false);
  await showAd(() => setMuted(true));
  newRun();
  last = performance.now(); acc = 0;
  setMuted(hidden);
  setInputEnabled(true);
  inBreak = false;
  gameplayStart();
}

function update() {
  const p = state.player;
  if (state.over || !started) return;
  if (keys.ArrowLeft || keys.a) p.x -= 4;
  if (keys.ArrowRight || keys.d) p.x += 4;
  p.vy += 0.5;
  p.y += p.vy;
  p.grounded = false;
  for (const s of state.islands) {
    if (p.vy >= 0 && overlap(p, s) && p.y + p.h - p.vy <= s.y + 4) { p.y = s.y - p.h; p.vy = 0; p.grounded = true; }
  }
  for (const g of state.gems) if (!g.taken && overlap(p, g)) { g.taken = true; state.score += 5; play("gem"); }
  for (const c of state.storms) {
    c.x += c.vx;
    if (c.x < 0 || c.x + c.w > 960) c.vx *= -1;
    if (overlap(p, c)) gameOver();
  }
  if (p.y > 560) gameOver();
}

function gameOver() {
  if (state.over) return;
  state.over = true;
  gameplayStop();
  if (state.score > data.best) data.best = state.score;
  data.gems += state.gems.filter((g) => g.taken).length;
  save(data);
}

function draw() {
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle = "#3b5";
  for (const s of state.islands) ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.fillStyle = "#6cf";
  for (const g of state.gems) if (!g.taken) ctx.fillRect(g.x, g.y, g.w, g.h);
  ctx.fillStyle = "#889";
  for (const c of state.storms) ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.fillStyle = "#fd5";
  ctx.fillRect(state.player.x, state.player.y, state.player.w, state.player.h);
  ctx.fillStyle = "#fff";
  ctx.font = "18px sans-serif";
  ctx.fillText(`Score ${state.score}   Best ${data.best}`, 16, 28);
  if (!started) ctx.fillText("Arrows/WASD move, space jumps. Press any key.", 290, 270);
  else if (state.over && !inBreak) ctx.fillText("Storm got you. Press space.", 380, 270);
}

function loop(now) {
  if (!hidden && !inBreak) {
    acc += Math.min(now - last, 250);
    while (acc >= STEP) { update(); acc -= STEP; }
  }
  last = now;
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener("visibilitychange", () => {
  hidden = document.hidden;
  if (!inBreak) setMuted(hidden);
  last = performance.now(); acc = 0;
});

async function boot() {
  data = load();
  newRun();
  bindInput(canvas, jump, firstInput);
  await initSdk();
  loadingFinished();
  last = performance.now();
  requestAnimationFrame(loop);
}

boot();
