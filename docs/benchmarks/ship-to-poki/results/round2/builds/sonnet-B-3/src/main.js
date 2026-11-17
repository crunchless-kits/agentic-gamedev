import { initSdk, showAd, loadingFinished, gameplayStart, gameplayStop } from "./sdk.js";
import { startMusic, play, setMuted } from "./audio.js";
import { load, save } from "./save.js";
import { keys, bindInput, clearKeys } from "./input.js";
import { fetchTopScores } from "./net.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const STEP = 1000 / 60; // fixed simulation step, ms
const MAX_FRAME = 250; // clamp long frames (tab switches, breakpoints)

// mode: "ready" (waiting for first input), "playing", "over", "break" (ad running)
let mode = "ready";
let hidden = false;
let state, data = { best: 0, gems: 0 }, topScores = [];
let last = 0, acc = 0;

function newRun() {
  const islands = makeIslands();
  state = {
    player: { x: 60, y: 300, w: 28, h: 28, vy: 0, grounded: false },
    islands,
    gems: makeGems(islands),
    storms: makeStorms(),
    score: 0,
  };
  clearKeys();
}

function beginPlay() {
  mode = "playing";
  startMusic();
  gameplayStart();
}

async function restart() {
  mode = "break"; // blocks input until the break ends
  await showAd(() => setMuted(true), () => setMuted(hidden));
  newRun();
  beginPlay();
}

function onAny() {
  if (mode === "ready") beginPlay();
  else if (mode === "over") restart();
}

function onJump() {
  if (mode !== "playing" || hidden) return;
  if (state.player.grounded) { state.player.vy = -11; state.player.grounded = false; play("jump"); }
}

function update() {
  const p = state.player;
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
    if (overlap(p, c)) { gameOver(); return; }
  }
  if (p.y > 560) gameOver();
}

function gameOver() {
  if (mode !== "playing") return;
  mode = "over";
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
  const top = topScores[0]?.score;
  ctx.fillText(`Score ${state.score}   Best ${data.best}` + (top === undefined ? "" : `   Top ${top}`), 16, 28);
  if (mode === "ready") ctx.fillText("Press any key or tap to start", 350, 270);
  if (mode === "over") ctx.fillText("Storm got you. Press space or tap.", 350, 270);
}

function loop(now) {
  const dt = Math.min(now - last, MAX_FRAME);
  last = now;
  if (mode === "playing" && !hidden) {
    acc += dt;
    while (acc >= STEP && mode === "playing") { update(); acc -= STEP; }
  } else {
    acc = 0;
  }
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener("visibilitychange", () => {
  hidden = document.hidden;
  setMuted(hidden || mode === "break");
  clearKeys();
  last = performance.now();
  acc = 0;
  if (mode === "playing") hidden ? gameplayStop() : gameplayStart();
});

async function boot() {
  newRun();
  bindInput(canvas, { onJump, onAny });
  requestAnimationFrame((t) => { last = t; loop(t); });
  await initSdk();
  data = load();
  loadingFinished();
  // The leaderboard is optional and never blocks play.
  fetchTopScores().then((scores) => { topScores = scores; });
}

boot();
