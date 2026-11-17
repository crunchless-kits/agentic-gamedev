import {
  initSdk,
  gameLoadingFinished,
  gameplayStart,
  gameplayStop,
  commercialBreak,
} from "./sdk.js";
import { startMusic, play, setMuted, setHidden } from "./audio.js";
import { load, save } from "./save.js";
import { keys, bindKeys, bindTouch } from "./input.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let state, data;
let busy = false;        // true while a commercial break is running
let musicStarted = false;
let loadingReported = false;

function newRun() {
  const islands = makeIslands();
  state = {
    player: { x: 60, y: 300, w: 28, h: 28, vy: 0, grounded: false },
    islands,
    gems: makeGems(islands),
    storms: makeStorms(),
    score: 0,
    over: false,
    started: false, // gameplayStart fires once per run, on the first player input
  };
}

function onInput() {
  if (busy || state.over) return;
  if (!musicStarted) {
    musicStarted = true;
    startMusic();
  }
  if (!state.started) {
    state.started = true;
    gameplayStart();
  }
}

function jump() {
  if (busy) return;
  if (state.over) { restart(); return; }
  if (state.player.grounded) { state.player.vy = -11; state.player.grounded = false; play("jump"); }
}

async function restart() {
  busy = true;
  try {
    await commercialBreak(() => setMuted(true));
    newRun();
    state.started = true;
    gameplayStart();
  } finally {
    setMuted(false);
    busy = false;
  }
}

function update() {
  const p = state.player;
  if (state.over || busy) return;
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
  if (state.over) ctx.fillText("Storm got you. Press space or tap to try again.", 300, 270);
}

// Fixed simulation step, so speed does not depend on the display's frame rate.
const STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5; // caps catch-up after a stall
let lastFrame = null;
let accumulator = 0;

function loop(now) {
  if (lastFrame === null) lastFrame = now;
  accumulator += now - lastFrame;
  lastFrame = now;
  let steps = 0;
  while (accumulator >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
    update();
    accumulator -= STEP_MS;
    steps++;
  }
  if (steps === MAX_STEPS_PER_FRAME) accumulator = 0;
  draw();
  if (!loadingReported) {
    loadingReported = true;
    gameLoadingFinished();
  }
  requestAnimationFrame(loop);
}

// Hidden tab: silence audio and reset the frame clock so the return does not jump.
document.addEventListener("visibilitychange", () => {
  setHidden(document.hidden);
  lastFrame = null;
  accumulator = 0;
});

async function boot() {
  await initSdk(); // never rejects; the game loads with or without the SDK
  data = load();
  newRun();
  bindKeys({ onJump: jump, onInput });
  bindTouch(canvas, { onJump: jump, onInput });
  requestAnimationFrame(loop);
}

boot();
