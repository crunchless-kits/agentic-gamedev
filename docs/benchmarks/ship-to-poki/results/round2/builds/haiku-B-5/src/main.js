import {
  initSdk,
  gameLoadingFinished,
  gameplayStart,
  gameplayStop,
  commercialBreak,
} from "./sdk.js";
import { startMusic, play, setMuted } from "./audio.js";
import { load, save } from "./save.js";
import { keys, bindInput } from "./input.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const W = 960;
const H = 540;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const STEP = 1000 / 60; // fixed simulation step: same speed at any frame rate
const MAX_FRAME = 250;  // ms; caps catch-up after a stall

let state, data;
let adRunning = false; // a commercial break is in progress
let tabHidden = false; // the tab is in the background
let started = false;   // the player has given input at least once
let sdkReady = Promise.resolve();
let last = null;
let acc = 0;

function syncMute() {
  setMuted(adRunning || tabHidden);
}

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

function onInput() {
  if (adRunning || started) return;
  started = true;
  startMusic();                          // browsers allow audio only after a gesture
  sdkReady.then(() => gameplayStart());  // Poki: first player input, not load
}

function jump() {
  if (adRunning) return;
  if (state.over) { restart(); return; }
  if (state.player.grounded) { state.player.vy = -11; state.player.grounded = false; play("jump"); }
}

async function restart() {
  if (adRunning) return;
  adRunning = true;
  try {
    await sdkReady;
    // Break first, then gameplay. Audio is muted and input ignored during the break.
    await commercialBreak(() => {
      keys.ArrowLeft = keys.ArrowRight = keys.a = keys.d = false;
      setMuted(true);
    });
  } finally {
    adRunning = false;
    syncMute();
    newRun();
    gameplayStart();
  }
}

function update() {
  const p = state.player;
  if (state.over || adRunning) return;
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
    if (c.x < 0 || c.x + c.w > W) c.vx *= -1;
    if (overlap(p, c)) gameOver();
  }
  if (p.y > H + 20) gameOver();
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
  if (state.over && !adRunning) ctx.fillText("Storm got you. Press space or tap to try again.", 300, 270);
}

function frame(now) {
  if (last === null) last = now;
  acc += Math.min(now - last, MAX_FRAME);
  last = now;
  if (!tabHidden) {
    while (acc >= STEP) {
      update();
      acc -= STEP;
    }
  }
  draw();
  requestAnimationFrame(frame);
}

function boot() {
  data = load();
  newRun();
  bindInput(canvas, { onJump: jump, onInput });
  document.addEventListener("visibilitychange", () => {
    tabHidden = document.hidden;
    last = null; // no catch-up burst when the tab returns
    acc = 0;
    syncMute();
  });
  sdkReady = initSdk().then(() => gameLoadingFinished());
  requestAnimationFrame(frame);
}

boot();
