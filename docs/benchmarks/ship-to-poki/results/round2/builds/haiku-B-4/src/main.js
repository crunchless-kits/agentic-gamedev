import { initSdk, loadingFinished, gameplayStart, gameplayStop, commercialBreak } from "./sdk.js";
import { startMusic, pauseMusic, resumeMusic, setMuted, play } from "./audio.js";
import { load, save } from "./save.js";
import { keys, bindInput } from "./input.js";
import { fetchTopScores } from "./net.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Fixed simulation step: physics is tuned per 60 Hz step, so 144 Hz screens play at the same speed.
const STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;

// title: waiting for the first input. playing: a run is live. over: waiting for restart.
// break: an ad break is running; input is ignored.
let phase = "title";
let state, data, topScores = [];
let acc = 0, last = 0;
let loadedSignalSent = false;

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

function onInput() {
  if (phase === "break") return;
  startMusic();
  if (phase === "title") {
    phase = "playing";
    gameplayStart();
    jump();
  } else if (phase === "over") {
    restart();
  } else {
    jump();
  }
}

async function restart() {
  phase = "break";
  setMuted(true);
  try {
    await commercialBreak(() => setMuted(true));
  } finally {
    setMuted(false);
    newRun();
    phase = "playing";
    gameplayStart();
  }
}

function update() {
  if (phase !== "playing") return;
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
  ctx.fillText(`Score ${state.score}   Best ${data.best}   Top ${topScores[0]?.score ?? "-"}`, 16, 28);
  if (phase === "title") ctx.fillText("Press space or tap to start.", 370, 270);
  if (phase === "over") ctx.fillText("Storm got you. Press space or tap.", 350, 270);
}

function loop(now) {
  if (!document.hidden) {
    acc += Math.min(now - last, 250);
    let steps = 0;
    while (acc >= STEP_MS && steps < MAX_STEPS_PER_FRAME) { update(); acc -= STEP_MS; steps++; }
    if (steps === MAX_STEPS_PER_FRAME) acc = 0;
  }
  last = now;
  draw();
  if (!loadedSignalSent) {
    loadedSignalSent = true;
    loadingFinished();
  }
  requestAnimationFrame(loop);
}

function onVisibilityChange() {
  if (document.hidden) {
    pauseMusic();
    if (phase === "playing") gameplayStop();
  } else {
    acc = 0;
    resumeMusic();
    if (phase === "playing") gameplayStart();
  }
}

async function boot() {
  bindInput(canvas, onInput);
  document.addEventListener("visibilitychange", onVisibilityChange);
  await initSdk();
  data = load();
  newRun();
  fetchTopScores().then((s) => { topScores = s; });
  last = performance.now();
  requestAnimationFrame(loop);
}

boot();
