import { initSdk, loadingFinished, gameplayStart, gameplayStop, commercialBreak } from "./sdk.js";
import { startMusic, play, setMuted } from "./audio.js";
import { load, save } from "./save.js";
import { keys, bindKeys, bindTouch } from "./input.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let state, data, busy = false;

function newRun() {
  const islands = makeIslands();
  state = {
    player: { x: 60, y: 300, w: 28, h: 28, vy: 0, grounded: false },
    islands,
    gems: makeGems(islands),
    storms: makeStorms(),
    score: 0,
    over: false,
    paused: false,
    started: false, // the run waits for the first input, so the player does not fall before they play
  };
}

function isJump(key) {
  return key === " " || key === "ArrowUp" || key === "w";
}

// Single entry point for keyboard and touch input.
function onInput(key) {
  if (busy) return;
  if (key === "Escape") {
    if (state.started && !state.over) togglePause();
    return;
  }
  if (state.over) {
    if (isJump(key)) restart();
    return;
  }
  if (state.paused) return;
  if (!state.started) {
    state.started = true;
    startMusic();
  }
  gameplayStart();
  if (isJump(key)) jump();
}

function togglePause() {
  state.paused = !state.paused;
  if (state.paused) gameplayStop();
  else gameplayStart();
}

function jump() {
  if (state.player.grounded) {
    state.player.vy = -11;
    state.player.grounded = false;
    play("jump");
  }
}

async function restart() {
  busy = true;
  try {
    // Mute while the ad plays, then restore audio whether or not an ad showed.
    await commercialBreak(() => setMuted(true));
  } finally {
    setMuted(false);
    newRun();
    busy = false;
  }
}

function update() {
  const p = state.player;
  if (state.over || state.paused || !state.started) return;
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
  if (state.over) return;
  state.over = true;
  gameplayStop();
  data.best = Math.max(data.best, state.score);
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
  if (!state.started) ctx.fillText("Arrows or WASD to move, space to jump. Esc pauses.", 300, 270);
  if (state.paused) ctx.fillText("Paused. Press Esc to resume.", 380, 270);
  if (state.over) ctx.fillText("Storm got you. Press space or tap Jump to retry.", 290, 270);
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
  bindKeys(onInput);
  bindTouch(onInput);
  // Pause when the tab is hidden, so no play time runs in the background.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.started && !state.over && !state.paused) togglePause();
  });
  loop();
  loadingFinished();
}

boot();
