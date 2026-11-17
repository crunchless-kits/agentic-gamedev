import { initSdk, showAd, loadingFinished, gameplayStart, gameplayStop } from "./sdk.js";
import { startMusic, play, setMuted } from "./audio.js";
import { load, save } from "./save.js";
import { keys, bindInput, setInputEnabled } from "./input.js";
import { PAL, feel } from "./feel.js";
import { burst, dust, ring, popup, shake, flash, hitStop, frozen, tick, clearFx } from "./fx.js";
import { render } from "./render.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const STEP = 1000 / 60;

// phase: ready (waiting for first input) | playing | over | break (ad running)
let ticks = 0, combo = 0, comboT = 0;
let state, data = { best: 0, gems: 0 }, phase = "ready", hidden = false;

function newRun() {
  const islands = makeIslands();
  state = {
    player: { x: 60, y: 300, w: 28, h: 28, vy: 0, grounded: false, vx: 0, sx: 1, sy: 1 },
    islands,
    gems: makeGems(islands),
    storms: makeStorms(),
    score: 0,
  };
}

function onAction() {
  if (phase !== "ready") return;
  phase = "playing";
  startMusic();
  gameplayStart();
}

function jump() {
  if (phase === "over") { restart(); return; }
  if (phase !== "playing") return;
  if (state.player.grounded) { state.player.vy = -11; state.player.grounded = false; play("jump");
    const p = state.player; p.sx = feel.jump.squashX; p.sy = feel.jump.squashY;
    dust(p.x + p.w / 2, p.y + p.h, feel.jump.dust, PAL.grassLight);
  }
}

async function restart() {
  phase = "break";
  setInputEnabled(false);
  await showAd(() => setMuted(true));
  setMuted(hidden);
  newRun();
  clearFx();
  setInputEnabled(true);
  phase = "playing";
  gameplayStart();
}

function update() {
  const p = state.player;
  // Squash/stretch springs back to 1 every tick, in every phase.
  p.sx += (1 - p.sx) * feel.spring; p.sy += (1 - p.sy) * feel.spring;
  if (phase !== "playing") return;
  if (frozen()) return; // hit-stop
  if (comboT > 0 && --comboT === 0) combo = 0;
  p.vx = 0;
  if (keys.ArrowLeft || keys.a) p.vx -= 4;
  if (keys.ArrowRight || keys.d) p.vx += 4;
  p.x += p.vx;
  if (p.vx && ticks % 6 === 0) dust(p.x + p.w / 2, p.y + p.h, 1, PAL.shadow);
  const preVy = p.vy, wasGrounded = p.grounded;
  p.vy += 0.5;
  p.y += p.vy;
  p.grounded = false;
  for (const s of state.islands) {
    if (p.vy >= 0 && overlap(p, s) && p.y + p.h - p.vy <= s.y + 4) { p.y = s.y - p.h; p.vy = 0; p.grounded = true; }
  }
  if (p.grounded && !wasGrounded && preVy >= feel.land.minVy) {
    p.sx = feel.land.squashX; p.sy = feel.land.squashY;
    dust(p.x + p.w / 2, p.y + p.h, feel.land.dust, PAL.grassLight);
    shake(feel.land.shake, feel.land.shakeMs);
  }
  for (const g of state.gems) if (!g.taken && overlap(p, g)) { g.taken = true; state.score += 5; onGem(g); }
  for (const c of state.storms) {
    c.x += c.vx;
    if (c.x < 0 || c.x + c.w > 960) c.vx *= -1;
    if (overlap(p, c)) gameOver();
  }
  if (p.y > 560) gameOver();
}

function onGem(g) {
  combo++; comboT = Math.round(feel.gem.comboMs / STEP);
  play("gem", Math.min(feel.gem.pitchMax, 1 + (combo - 1) * feel.gem.pitchStep));
  const x = g.x + g.w / 2, y = g.y + g.h / 2;
  burst(x, y, feel.gem.burst, PAL.gem, 3.5, 0.08);
  ring(x, y, feel.gem.ring, PAL.gemCore);
  popup(x, y - 14, combo > 1 ? `+5 x${combo}` : "+5", PAL.gemCore, feel.gem.popMs);
  hitStop(feel.gem.hitStopMs);
}

function gameOver() {
  if (phase !== "playing") return;
  phase = "over";
  const p = state.player;
  burst(p.x + p.w / 2, p.y + p.h / 2, feel.death.burst, PAL.hero, 5, 0.18, 6);
  shake(feel.death.shake, feel.death.shakeMs); flash(feel.death.flashMs);
  gameplayStop();
  if (state.score > data.best) data.best = state.score;
  data.gems += state.gems.filter((g) => g.taken).length;
  save(data);
}

function draw() { render(ctx, state, data, phase, ticks); }

let last = 0, acc = 0;
function loop(t) {
  requestAnimationFrame(loop);
  if (hidden) { last = t; return; }
  acc += Math.min(t - last, 250);
  last = t;
  while (acc >= STEP) { ticks++; update(); tick(); acc -= STEP; }
  draw();
}

function onVisibility() {
  hidden = document.hidden;
  setMuted(hidden || phase === "break");
  if (phase === "playing") { if (hidden) gameplayStop(); else gameplayStart(); }
  last = performance.now();
  acc = 0;
}

async function boot() {
  await initSdk();
  data = load();
  newRun();
  bindInput(canvas, onAction, jump);
  document.addEventListener("visibilitychange", onVisibility);
  draw();
  loadingFinished();
  requestAnimationFrame((t) => { last = t; loop(t); });
}

boot();
