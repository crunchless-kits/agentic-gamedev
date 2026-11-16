import { initSdk, showAd, gameplayStart, gameplayStop } from "./sdk.js";
import { startMusic, play } from "./audio.js";
import { load, save } from "./save.js";
import { keys, bindKeys, bindTouch } from "./input.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let state, data;
let paused = false;
let adBusy = false;

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
  paused = false;
}

// Any key press during a live run starts the music and the Poki gameplay session (once).
function onInput() {
  if (!state || state.over || paused || adBusy) return;
  startMusic();
  gameplayStart();
}

function onJump() {
  if (!state || paused || adBusy) return;
  if (state.over) { restart(); return; }
  if (state.player.grounded) { state.player.vy = -11; state.player.grounded = false; play("jump"); }
}

function onPause() {
  if (!state || state.over || adBusy) return;
  paused = !paused;
  if (paused) gameplayStop(); else gameplayStart();
}

async function restart() {
  if (adBusy) return;
  adBusy = true;
  try {
    await showAd();
  } finally {
    adBusy = false;
  }
  newRun();
}

function update() {
  if (state.over || paused) return;
  const p = state.player;
  if (keys.ArrowLeft || keys.a) p.x -= 4;
  if (keys.ArrowRight || keys.d) p.x += 4;
  p.x = Math.max(0, Math.min(960 - p.w, p.x));
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
  if (state.over) ctx.fillText("Storm got you. Press space or tap jump to retry.", 260, 270);
  else if (paused) ctx.fillText("Paused. Press Esc to resume.", 360, 270);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

async function boot() {
  await initSdk();
  data = load();
  newRun();
  bindKeys({ onInput, onJump, onPause });
  bindTouch({ onInput, onJump });
  loop();
}

boot();
