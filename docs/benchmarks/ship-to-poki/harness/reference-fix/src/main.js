import * as sdk from "./sdk.js";
import { startMusic, pauseMusic, resumeMusic, setMuted, play } from "./audio.js";
import { load, save } from "./save.js";
import { held, clearHeld, bindInput } from "./input.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const W = 960, H = 540;
const MOVE = 240, GRAVITY = 1800, JUMP = -660; // px per second, from the old per-frame values at 60 fps
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let state, data = { best: 0, gems: 0 };
let phase = "ready"; // ready | playing | over | ad | paused
let last = 0;

function resize() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = `${Math.floor(W * s)}px`;
  canvas.style.height = `${Math.floor(H * s)}px`;
}

function newRun() {
  const islands = makeIslands();
  state = {
    player: { x: 60, y: 300, w: 28, h: 28, vy: 0, grounded: false },
    islands,
    gems: makeGems(islands),
    storms: makeStorms().map((c) => ({ ...c, vx: c.vx * 60 })),
    score: 0,
  };
}

function onAction() {
  if (phase === "ready") { phase = "playing"; startMusic(); sdk.gameplayStart(); return; }
  if (phase === "over") { restart(); return; }
  if (phase === "playing" && state.player.grounded) { state.player.vy = JUMP; state.player.grounded = false; play("jump"); }
}

async function restart() {
  if (phase !== "over") return;
  phase = "ad";
  clearHeld();
  await sdk.commercialBreak(() => setMuted(true));
  setMuted(false);
  newRun();
  phase = "playing";
  sdk.gameplayStart();
}

function gameOver() {
  if (phase !== "playing") return;
  phase = "over";
  sdk.gameplayStop();
  if (state.score > data.best) data.best = state.score;
  data.gems += state.gems.filter((g) => g.taken).length;
  save(data);
}

function update(dt) {
  const p = state.player;
  if (held.left) p.x -= MOVE * dt;
  if (held.right) p.x += MOVE * dt;
  p.vy += GRAVITY * dt;
  const prevBottom = p.y + p.h;
  p.y += p.vy * dt;
  p.grounded = false;
  for (const s of state.islands) {
    if (p.vy >= 0 && overlap(p, s) && prevBottom <= s.y + 4) { p.y = s.y - p.h; p.vy = 0; p.grounded = true; }
  }
  for (const g of state.gems) if (!g.taken && overlap(p, g)) { g.taken = true; state.score += 5; play("gem"); }
  for (const c of state.storms) {
    c.x += c.vx * dt;
    if (c.x < 0 || c.x + c.w > W) c.vx *= -1;
    if (overlap(p, c)) { gameOver(); return; }
  }
  if (p.y > H + 20) gameOver();
}

function draw() {
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, W, H);
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
  if (phase === "ready") ctx.fillText("Press space or tap to start.", 370, 270);
  if (phase === "over") ctx.fillText("Storm got you. Press space or tap.", 350, 270);
  if (phase === "paused") ctx.fillText("Paused", 440, 270);
}

function loop(t) {
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;
  if (phase === "playing") update(dt);
  draw();
  requestAnimationFrame(loop);
}

function onVisibility() {
  if (document.hidden) {
    if (phase === "playing") { phase = "paused"; sdk.gameplayStop(); }
    pauseMusic();
    clearHeld();
  } else {
    if (phase === "paused") { phase = "playing"; sdk.gameplayStart(); }
    if (phase !== "ready") resumeMusic();
    last = performance.now();
  }
}

async function boot() {
  await sdk.initSdk();
  data = load();
  newRun();
  bindInput(canvas, onAction);
  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", onVisibility);
  sdk.loadingFinished();
  last = performance.now();
  requestAnimationFrame(loop);
}

boot();
