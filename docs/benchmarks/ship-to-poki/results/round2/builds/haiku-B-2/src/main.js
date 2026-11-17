import { initSdk, loadingFinished, gameplayStart, gameplayStop, commercialBreak } from "./sdk.js";
import { startMusic, pauseMusic, resumeMusic, play, setMuted } from "./audio.js";
import { load, save } from "./save.js";
import { keys, bindInput } from "./input.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = 960;
const HEIGHT = 540;
const STEP = 1 / 60; // fixed simulation step, so speed does not depend on frame rate

// title: waiting for first input. playing. paused: tab hidden, or waiting to resume.
// over: storm got you. break: commercial break running, input ignored.
let phase = "title";
let ready = false; // true once the SDK has settled and loadingFinished() was sent
let state, data;
let last = 0;
let acc = 0;

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

function jump() {
  const p = state.player;
  if (p.grounded) { p.vy = -11; p.grounded = false; play("jump"); }
}

// Every press (key or tap) goes through here.
function act() {
  if (!ready) return;
  if (phase === "title") {
    phase = "playing";
    gameplayStart();
    startMusic();
    jump();
  } else if (phase === "playing") {
    jump();
  } else if (phase === "paused") {
    phase = "playing";
    gameplayStart();
    resumeMusic();
  } else if (phase === "over") {
    restartWithBreak();
  }
}

// Order from the Poki docs: gameplayStop (already sent at death), commercialBreak, gameplayStart.
async function restartWithBreak() {
  phase = "break";
  await commercialBreak(() => setMuted(true));
  setMuted(false);
  newRun();
  phase = "playing";
  resumeMusic();
  gameplayStart();
}

function gameOver() {
  if (phase !== "playing") return;
  phase = "over";
  gameplayStop();
  pauseMusic();
  if (state.score > data.best) data.best = state.score;
  data.gems += state.gems.filter((g) => g.taken).length;
  save(data);
}

function update() {
  const p = state.player;
  if (keys.ArrowLeft || keys.a || keys.left) p.x -= 4;
  if (keys.ArrowRight || keys.d || keys.right) p.x += 4;
  p.vy += 0.5;
  p.y += p.vy;
  p.grounded = false;
  for (const s of state.islands) {
    if (p.vy >= 0 && overlap(p, s) && p.y + p.h - p.vy <= s.y + 4) { p.y = s.y - p.h; p.vy = 0; p.grounded = true; }
  }
  for (const g of state.gems) if (!g.taken && overlap(p, g)) { g.taken = true; state.score += 5; play("gem"); }
  for (const c of state.storms) {
    c.x += c.vx;
    if (c.x < 0 || c.x + c.w > WIDTH) c.vx *= -1;
    if (overlap(p, c)) { gameOver(); return; }
  }
  if (p.y > HEIGHT + 20) gameOver();
}

function draw() {
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
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
  if (phase === "title") ctx.fillText("Press space or tap to start", 340, 270);
  if (phase === "paused") ctx.fillText("Paused. Press space or tap to continue.", 310, 270);
  if (phase === "over") ctx.fillText("Storm got you. Press space or tap.", 330, 270);
}

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (phase === "playing") {
    acc += dt;
    while (acc >= STEP && phase === "playing") {
      update();
      acc -= STEP;
    }
  } else {
    acc = 0;
  }
  draw();
  requestAnimationFrame(frame);
}

// Pause when the tab is hidden. Reset the frame clock on return so no time jump happens.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (phase === "playing") {
      phase = "paused";
      gameplayStop();
      pauseMusic();
    }
  } else {
    last = performance.now();
    acc = 0;
  }
});

async function boot() {
  data = load();
  newRun();
  last = performance.now();
  bindInput(canvas, act);
  requestAnimationFrame(frame);
  await initSdk();
  loadingFinished();
  ready = true;
}

boot();
