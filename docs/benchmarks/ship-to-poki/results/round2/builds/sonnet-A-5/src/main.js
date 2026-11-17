import { initSdk, showAd, loadingFinished, gameplayStart, gameplayStop } from "./sdk.js";
import { startMusic, play } from "./audio.js";
import { load, save } from "./save.js";
import { keys, bindKeys } from "./input.js";
import { fetchTopScores } from "./net.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let state, data, topScores = [];

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
  gameplayStart();
}

let restarting = false;

function jump() {
  startMusic(); // first user gesture: allowed by autoplay policy
  if (!state || restarting) return;
  if (state.over) { restart(); return; }
  if (state.player.grounded) { state.player.vy = -11; state.player.grounded = false; play("jump"); }
}

async function restart() {
  restarting = true;
  try { await showAd(); } finally { restarting = false; }
  newRun();
}

function update() {
  const p = state.player;
  if (state.over) return;
  if (keys.arrowleft || keys.a) p.x -= 4;
  if (keys.arrowright || keys.d) p.x += 4;
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
  ctx.fillText(`Score ${state.score}   Best ${data.best}   Top ${topScores[0]?.score ?? "-"}`, 16, 28);
  if (state.over) ctx.fillText("Storm got you. Press space.", 380, 270);
}

// Fixed 60 Hz simulation so speed is the same on 60/120/144 Hz displays.
const STEP = 1000 / 60;
let last = 0, acc = 0;

function loop(t) {
  if (last) acc += Math.min(t - last, 250); // clamp after tab was hidden
  last = t;
  while (acc >= STEP) { update(); acc -= STEP; }
  draw();
  requestAnimationFrame(loop);
}

async function boot() {
  data = load();
  bindKeys(jump);
  await initSdk();
  newRun();
  loadingFinished();
  requestAnimationFrame(loop);
  fetchTopScores().then((s) => { topScores = s; }); // optional, never blocks
}

boot();
