import { initSdk, loadingFinished, gameplayStart, gameplayStop, commercialBreak } from "./sdk.js";
import { startMusic, setPaused, play } from "./audio.js";
import { load, save } from "./save.js";
import { keys, bindInput, setInputLocked } from "./input.js";
import { fetchTopScores } from "./net.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const STEP = 1000 / 60; // fixed simulation step, independent of display refresh

let state, data = { best: 0, gems: 0 }, topScores = [];
let started = false; // player has given first input
let breaking = false; // ad break in progress
let hidden = false;
let last = 0, acc = 0;

const playing = () => started && !state.over && !breaking && !hidden;

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

function onInput(isJump) {
  if (breaking || hidden || !state) return;
  if (state.over) { if (isJump) restart(); return; }
  if (!started) {
    started = true;
    startMusic(); // first user gesture
    gameplayStart();
  }
  if (isJump && state.player.grounded) { state.player.vy = -11; state.player.grounded = false; play("jump"); }
}

// gameplayStop() already fired at game over. Break, then start the new run.
async function restart() {
  breaking = true;
  setInputLocked(true);
  setPaused(true);
  try { await commercialBreak(); } finally {
    setPaused(hidden);
    setInputLocked(false);
    newRun();
    breaking = false;
    if (!hidden) gameplayStart();
  }
}

function update() {
  const p = state.player;
  if (state.over) return;
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
  ctx.fillText(`Score ${state.score}   Best ${data.best}   Top ${topScores[0]?.score ?? "-"}`, 16, 28);
  if (state.over) ctx.fillText("Storm got you. Press space or tap.", 340, 270);
  else if (!started) ctx.fillText("Press space or tap to start", 350, 270);
}

function loop(t) {
  requestAnimationFrame(loop);
  if (hidden) return;
  if (!last) last = t;
  acc += Math.min(t - last, 100); // clamp long gaps (tab switch, breakpoint)
  last = t;
  while (acc >= STEP) { if (playing()) update(); acc -= STEP; }
  draw();
}

document.addEventListener("visibilitychange", () => {
  const wasPlaying = playing();
  hidden = document.hidden;
  last = 0; acc = 0;
  if (hidden) {
    setPaused(true);
    if (wasPlaying) gameplayStop();
  } else {
    if (!breaking) setPaused(false);
    if (started && state && !state.over && !breaking) gameplayStart();
  }
});

async function boot() {
  data = load();
  newRun();
  bindInput(canvas, onInput);
  requestAnimationFrame(loop);
  await initSdk(); // resolves false on ad block / missing SDK; game runs anyway
  fetchTopScores().then((s) => { topScores = s; });
  loadingFinished();
}

boot();
