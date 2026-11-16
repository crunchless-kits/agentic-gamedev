import { initSdk, loadingFinished, gameplayStart, gameplayStop, showAd } from "./sdk.js";
import { startMusic, play, setMuted } from "./audio.js";
import { load, save } from "./save.js";
import { keys, touch, bindInput, bindTouch } from "./input.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const W = 960;
const H = 540;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let state, data;
let runStarted = false; // first input of this run has happened; world is frozen until then
let playing = false;    // Poki gameplay flag: true between gameplayStart and gameplayStop
let paused = false;
let restarting = false;
let musicOn = false;

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
  runStarted = false;
}

// Poki: gameplayStart must not repeat, and gameplayStop must not repeat.
function startPlaying() {
  if (playing || paused || state.over) return;
  runStarted = true;
  playing = true;
  gameplayStart();
}

function stopPlaying() {
  if (!playing) return;
  playing = false;
  gameplayStop();
}

function pause() {
  if (paused || state.over) return;
  paused = true;
  stopPlaying();
}

function resume() {
  if (!paused) return;
  paused = false;
  startPlaying();
}

function togglePause() {
  if (paused) resume();
  else pause();
}

// Any press. Browsers only allow audio after a user gesture, so music starts here.
function onInput() {
  if (!musicOn) { musicOn = true; startMusic(); }
  if (paused) { resume(); return; }
  if (!state.over) startPlaying();
}

function onJump() {
  onInput();
  if (paused || restarting) return;
  if (state.over) { restart(); return; }
  if (state.player.grounded) { state.player.vy = -11; state.player.grounded = false; play("jump"); }
}

// Death -> gameplayStop (already sent by gameOver) -> commercialBreak -> gameplayStart.
async function restart() {
  if (restarting) return;
  restarting = true;
  await showAd(() => setMuted(true));
  setMuted(false);
  newRun();
  restarting = false;
  startPlaying();
}

function update() {
  if (!runStarted || paused || state.over) return;
  const p = state.player;
  if (keys.ArrowLeft || keys.a || touch.left) p.x -= 4;
  if (keys.ArrowRight || keys.d || touch.right) p.x += 4;
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
  stopPlaying();
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
  if (!runStarted && !state.over) ctx.fillText("Tap or press space to hop", 340, 200);
  if (paused) ctx.fillText("Paused. Press Esc or tap to resume.", 320, 270);
  if (state.over) ctx.fillText("Storm got you. Tap or press space.", 320, 270);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function boot() {
  data = load();
  newRun();
  bindInput({ onJump, onMove: onInput, onPause: togglePause });
  bindTouch(canvas, { onJump, onMove: onInput });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
  loop();
  initSdk().then(loadingFinished);
}

boot();
