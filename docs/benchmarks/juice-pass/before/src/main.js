import { initSdk, showAd, loadingFinished, gameplayStart, gameplayStop } from "./sdk.js";
import { startMusic, play, setMuted } from "./audio.js";
import { load, save } from "./save.js";
import { keys, bindInput, setInputEnabled } from "./input.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const STEP = 1000 / 60;

// phase: ready (waiting for first input) | playing | over | break (ad running)
let state, data = { best: 0, gems: 0 }, phase = "ready", hidden = false;

function newRun() {
  const islands = makeIslands();
  state = {
    player: { x: 60, y: 300, w: 28, h: 28, vy: 0, grounded: false },
    islands,
    gems: makeGems(islands),
    storms: makeStorms(),
    score: 0,
  };
}

function onAction() {
  if (phase !== "ready") return;
  phase = "playing";
  startMusic();
  gameplayStart();
}

function jump() {
  if (phase === "over") { restart(); return; }
  if (phase !== "playing") return;
  if (state.player.grounded) { state.player.vy = -11; state.player.grounded = false; play("jump"); }
}

async function restart() {
  phase = "break";
  setInputEnabled(false);
  await showAd(() => setMuted(true));
  setMuted(hidden);
  newRun();
  setInputEnabled(true);
  phase = "playing";
  gameplayStart();
}

function update() {
  const p = state.player;
  if (phase !== "playing") return;
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
  if (phase !== "playing") return;
  phase = "over";
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
  if (phase === "ready") ctx.fillText("Press space or tap to start", 350, 270);
  if (phase === "over") ctx.fillText("Storm got you. Press space or tap.", 340, 270);
}

let last = 0, acc = 0;
function loop(t) {
  requestAnimationFrame(loop);
  if (hidden) { last = t; return; }
  acc += Math.min(t - last, 250);
  last = t;
  while (acc >= STEP) { update(); acc -= STEP; }
  draw();
}

function onVisibility() {
  hidden = document.hidden;
  setMuted(hidden || phase === "break");
  if (phase === "playing") { if (hidden) gameplayStop(); else gameplayStart(); }
  last = performance.now();
  acc = 0;
}

async function boot() {
  await initSdk();
  data = load();
  newRun();
  bindInput(canvas, onAction, jump);
  document.addEventListener("visibilitychange", onVisibility);
  draw();
  loadingFinished();
  requestAnimationFrame((t) => { last = t; loop(t); });
}

boot();
