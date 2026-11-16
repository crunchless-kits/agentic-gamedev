import { initSdk, loadingFinished, gameplayStart, gameplayStop, commercialBreak } from "./sdk.js";
import { startMusic, play, setMuted } from "./audio.js";
import { load, save } from "./save.js";
import { keys, touch, bindKeys, bindTouch } from "./input.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let state, data;
let started = false; // set on first input: music starts and gameplayStart fires
let busy = false;    // a commercial break is running: ignore input and freeze updates

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

function begin() {
  started = true;
  startMusic();
  gameplayStart();
}

function jump() {
  if (busy) return;
  if (state.over) { restart(); return; }
  if (!started) begin();
  if (state.player.grounded) { state.player.vy = -11; state.player.grounded = false; play("jump"); }
}

async function restart() {
  busy = true;
  await commercialBreak(() => setMuted(true));
  setMuted(false);
  newRun();
  gameplayStart();
  busy = false;
}

function update() {
  const p = state.player;
  if (state.over || busy) return;
  const left = keys.ArrowLeft || keys.a || touch.left;
  const right = keys.ArrowRight || keys.d || touch.right;
  if (!started && (left || right)) begin();
  if (left) p.x -= 4;
  if (right) p.x += 4;
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
  if (state.over) return; // several storms can hit in one frame
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
  if (state.over) ctx.fillText("Storm got you. Press space or tap.", 340, 270);
}

// Pausing when the tab is hidden: play halts, so the SDK gets a stop; resume on return.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) gameplayStop();
  else if (started && state && !state.over && !busy) gameplayStart();
});

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

async function boot() {
  await initSdk();
  data = load();
  newRun();
  bindKeys(jump);
  bindTouch(canvas, jump);
  draw();
  loadingFinished(); // first playable frame is on screen
  loop();
}

boot();
