import { initSdk, gameLoadingFinished, gameplayStart, gameplayStop, commercialBreak } from "./sdk.js";
import { startMusic, play, setMuted } from "./audio.js";
import { load, save } from "./save.js";
import { isHeld, bindInput } from "./input.js";
import { fetchTopScores } from "./net.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const W = 960;
const H = 540;
const FALL_Y = 560;
const STEP_MS = 1000 / 60; // fixed simulation step: same speed at 60, 120, or 144 Hz

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// "ready": waiting for the first input. "playing". "paused": tab hidden, or back from hidden.
// "ad": commercial break running. "over": storm hit, waiting for a restart input.
let phase = "ready";
let adActive = false;
let state = null;
let data = load();
let topScores = [];
let acc = 0;
let last = 0;

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

function gameOver() {
  phase = "over";
  gameplayStop();
  data.best = Math.max(data.best, state.score);
  data.gems += state.gems.filter((g) => g.taken).length;
  save(data);
}

function update() {
  const p = state.player;
  if (isHeld("left")) p.x -= 4;
  if (isHeld("right")) p.x += 4;
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
    if (overlap(p, c)) { gameOver(); return; }
  }
  if (p.y > FALL_Y) gameOver();
}

function syncAudio() {
  setMuted(adActive || document.hidden);
}

// First input of a session: the only place gameplayStart fires on a fresh load.
function startSession() {
  phase = "playing";
  startMusic();
  gameplayStart();
}

// Break, then resume. Used after a game over (new run) and after a tab-hidden pause.
// Poki order: gameplayStop, commercialBreak, gameplayStart. No SDK events during the break.
async function resumeAfterBreak(withNewRun) {
  phase = "ad";
  adActive = true;
  syncAudio();
  await commercialBreak(() => {
    adActive = true;
    syncAudio();
  });
  adActive = false;
  if (withNewRun) newRun();
  if (document.hidden) {
    phase = "paused";
  } else {
    phase = "playing";
    gameplayStart();
  }
  syncAudio();
  acc = 0;
}

function onPress(action) {
  switch (phase) {
    case "ready":
      startSession();
      return;
    case "playing":
      if (action === "jump") jump();
      return;
    case "over":
      resumeAfterBreak(true);
      return;
    case "paused":
      resumeAfterBreak(false);
      return;
    default: // "ad": input is ignored during a break
  }
}

function draw() {
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, W, H);
  if (!state) return;
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
  const msg = {
    ready: "Press any key or tap to start",
    over: "Storm got you. Press any key or tap to play again",
    paused: "Paused. Press any key or tap to continue",
  }[phase];
  if (msg) {
    ctx.textAlign = "center";
    ctx.fillText(msg, W / 2, 270);
    ctx.textAlign = "left";
  }
}

function frame(now) {
  acc += Math.min(now - last, 250);
  last = now;
  if (phase === "playing") {
    while (acc >= STEP_MS && phase === "playing") {
      update();
      acc -= STEP_MS;
    }
  } else {
    acc = 0;
  }
  draw();
  requestAnimationFrame(frame);
}

async function boot() {
  await initSdk();
  newRun();
  bindInput(canvas, onPress);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && phase === "playing") {
      phase = "paused";
      gameplayStop();
    }
    syncAudio();
  });
  // Non-blocking: a blocked or slow request must never stop the game from starting.
  fetchTopScores().then((scores) => { topScores = scores; });
  last = performance.now();
  requestAnimationFrame(frame);
  gameLoadingFinished();
}

boot();
