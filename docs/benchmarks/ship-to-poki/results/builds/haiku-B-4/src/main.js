import { initSdk, loadingFinished, gameplayStart, gameplayStop, commercialBreak, openExternal } from "./sdk.js";
import { startMusic, play, setMuted } from "./audio.js";
import { load, save } from "./save.js";
import { keys, bindKeys, bindTouch, touch } from "./input.js";
import { fetchTopScores } from "./net.js";
import { makeIslands, makeGems, makeStorms, overlap } from "./world.js";

const MORE_GAMES_URL = "https://lumengames.example.com/more"; // TODO: confirm the real URL before submission

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// title -> playing <-> paused; playing -> over -> ad -> playing
let phase = "title";
let state, data, topScores = [];

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

// Space, up, W, or a tap in the middle of the screen.
function onAction() {
  if (phase === "title") return begin();
  if (phase === "over") return restartWithAd();
  if (phase === "playing") return jump();
  if (phase === "paused") return togglePause();
}

function begin() {
  phase = "playing";
  gameplayStart();
  startMusic(); // browsers allow audio only after a user gesture
}

function togglePause() {
  if (phase === "playing") { phase = "paused"; gameplayStop(); }
  else if (phase === "paused") { phase = "playing"; gameplayStart(); }
}

function onTap(zone) {
  if (zone === "mid" || phase === "title" || phase === "over" || phase === "paused") onAction();
}

async function restartWithAd() {
  phase = "ad";
  // Pause and mute only if an ad actually shows; the game is frozen while phase is "ad".
  await commercialBreak(() => setMuted(true));
  setMuted(false);
  newRun();
  phase = "playing";
  gameplayStart();
}

function update() {
  if (phase !== "playing") return;
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
    if (c.x < 0 || c.x + c.w > 960) c.vx *= -1;
    if (overlap(p, c)) return gameOver();
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
  if (phase === "title") ctx.fillText("Arrows or WASD to move, space to jump. Press space to start.", 200, 270);
  if (phase === "paused") ctx.fillText("Paused. Press P to resume.", 380, 270);
  if (phase === "over") ctx.fillText("Storm got you. Press space.", 380, 270);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

async function boot() {
  bindKeys(onAction, togglePause);
  bindTouch(canvas, onTap);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && phase === "playing") togglePause();
  });
  document.getElementById("more-games").addEventListener("click", (e) => {
    e.preventDefault();
    openExternal(MORE_GAMES_URL);
  });
  await initSdk();
  data = load();
  newRun();
  loop();
  loadingFinished();
  topScores = await fetchTopScores();
}

boot();
