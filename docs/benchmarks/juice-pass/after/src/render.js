// All visuals, drawn in code. Reads state, never changes gameplay.
import { PAL } from "./feel.js";
import { fx, shakeOffset, flashAlpha } from "./fx.js";

const W = 960, H = 540;
const FONT = "'Trebuchet MS', 'Segoe UI', sans-serif";
const STARS = Array.from({ length: 50 }, (_, i) => ({ x: (i * 197) % W, y: (i * 89) % 300, r: 0.8 + (i % 3) * 0.5, ph: i * 1.7 }));
const CLOUDS = Array.from({ length: 6 }, (_, i) => ({ x: i * 190, y: 330 + (i % 3) * 55, w: 150 + (i % 2) * 60, s: 0.15 + (i % 3) * 0.1 }));
let sky = null;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function text(ctx, s, x, y, size, color, align = "left") {
  ctx.font = `bold ${size}px ${FONT}`; ctx.textAlign = align;
  ctx.fillStyle = PAL.shadow; ctx.fillText(s, x + 2, y + 2);
  ctx.fillStyle = color; ctx.fillText(s, x, y);
}

function background(ctx, t) {
  if (!sky) {
    sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, PAL.skyTop); sky.addColorStop(0.55, PAL.skyMid); sky.addColorStop(1, PAL.skyLow);
  }
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PAL.star;
  for (const s of STARS) {
    ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(t / 50 + s.ph));
    ctx.fillRect(s.x, s.y, s.r * 2, s.r * 2);
  }
  ctx.globalAlpha = 1;
  for (const c of CLOUDS) {
    const x = ((c.x + t * c.s) % (W + 300)) - 150;
    ctx.fillStyle = c.s > 0.25 ? PAL.nearCloud : PAL.farCloud;
    rr(ctx, x, c.y, c.w, 26, 13); ctx.fill();
    rr(ctx, x + c.w * 0.2, c.y - 14, c.w * 0.5, 26, 13); ctx.fill();
  }
}

function island(ctx, s, t, i) {
  const bob = 0; // platforms stay exactly where collision is
  const y = s.y + bob;
  ctx.fillStyle = PAL.shadow; // drop shadow below keeps platforms readable on the sky
  ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, y + 46, s.w * 0.4, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PAL.dirt; // rocky underside
  ctx.beginPath();
  ctx.moveTo(s.x + 4, y + s.h - 2); ctx.lineTo(s.x + s.w - 4, y + s.h - 2);
  ctx.lineTo(s.x + s.w * 0.65, y + 40); ctx.lineTo(s.x + s.w * 0.5, y + 28); ctx.lineTo(s.x + s.w * 0.3, y + 38);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = PAL.dirtDark;
  ctx.fillRect(s.x + s.w * 0.45, y + s.h, 6, 18);
  ctx.fillStyle = PAL.grass; rr(ctx, s.x, y, s.w, s.h, 6); ctx.fill();
  ctx.fillStyle = PAL.grassLight; ctx.fillRect(s.x + 6, y + 2, s.w - 12, 4);
}

function gem(ctx, g, t, i) {
  const cx = g.x + g.w / 2, cy = g.y + g.h / 2 + Math.sin(t / 15 + i) * 3;
  const pulse = 1 + Math.sin(t / 10 + i) * 0.12;
  ctx.fillStyle = PAL.gemGlow;
  ctx.beginPath(); ctx.arc(cx, cy, 15 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PAL.gem;
  ctx.beginPath(); ctx.moveTo(cx, cy - 11); ctx.lineTo(cx + 9, cy); ctx.lineTo(cx, cy + 11); ctx.lineTo(cx - 9, cy); ctx.closePath(); ctx.fill();
  ctx.fillStyle = PAL.gemCore;
  ctx.beginPath(); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx + 3, cy - 2); ctx.lineTo(cx - 4, cy); ctx.closePath(); ctx.fill();
}

function storm(ctx, c, t, i) {
  const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
  ctx.fillStyle = PAL.storm;
  rr(ctx, c.x, c.y + 8, c.w, c.h - 8, 16); ctx.fill();
  ctx.beginPath(); ctx.arc(c.x + c.w * 0.32, c.y + 12, 16, 0, Math.PI * 2); ctx.arc(c.x + c.w * 0.62, c.y + 8, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PAL.stormLight; ctx.fillRect(c.x + 10, c.y + 10, c.w - 20, 3);
  ctx.fillStyle = PAL.bolt; // angry eyes
  ctx.fillRect(cx - 14, cy, 8, 5); ctx.fillRect(cx + 6, cy, 8, 5);
  if (Math.floor(t / 25 + i * 9) % 4 === 0) { // flicker bolt
    ctx.strokeStyle = PAL.bolt; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(cx, c.y + c.h); ctx.lineTo(cx - 6, c.y + c.h + 10); ctx.lineTo(cx + 3, c.y + c.h + 14); ctx.lineTo(cx - 3, c.y + c.h + 26); ctx.stroke();
  }
}

function hero(ctx, p, phase, t) {
  const cx = p.x + p.w / 2, base = p.y + p.h;
  const sx = p.sx || 1, sy = p.sy || 1;
  ctx.save();
  ctx.translate(cx, base); ctx.scale(sx, sy);
  const w = p.w, h = p.h;
  ctx.fillStyle = PAL.hero; rr(ctx, -w / 2, -h, w, h, 9); ctx.fill();
  ctx.fillStyle = PAL.heroDark; ctx.fillRect(-w / 2 + 3, -7, w - 6, 5);
  const look = p.vx > 0 ? 2 : p.vx < 0 ? -2 : 0;
  ctx.fillStyle = "#fff"; ctx.fillRect(-9 + look, -h + 7, 7, 9); ctx.fillRect(3 + look, -h + 7, 7, 9);
  ctx.fillStyle = PAL.ink;
  const blink = Math.floor(t / 12) % 14 === 0 ? 2 : 6;
  ctx.fillRect(-7 + look, -h + 9, 4, blink); ctx.fillRect(5 + look, -h + 9, 4, blink);
  ctx.restore();
}

function ui(ctx, state, data, phase, t) {
  rr(ctx, 12, 10, 270, 36, 10); ctx.fillStyle = PAL.shadow; ctx.fill();
  text(ctx, `Score ${state.score}`, 24, 35, 18, PAL.text);
  text(ctx, `Best ${data.best}`, 150, 35, 18, PAL.gem);
  if (phase === "ready" || phase === "over") {
    ctx.fillStyle = "rgba(20,10,40,0.45)"; ctx.fillRect(0, 0, W, H);
    rr(ctx, 250, 205, 460, 110, 18); ctx.fillStyle = PAL.shadow; ctx.fill();
    const bob = Math.sin(t / 12) * 2;
    if (phase === "ready") {
      text(ctx, "SKYHOP", W / 2, 248, 34, PAL.hero, "center");
      text(ctx, "Press space or tap to start", W / 2, 290 + bob, 18, PAL.text, "center");
    } else {
      text(ctx, "Storm got you", W / 2, 248, 34, PAL.danger, "center");
      text(ctx, "Press space or tap", W / 2, 290 + bob, 18, PAL.text, "center");
    }
  }
}

export function render(ctx, state, data, phase, t) {
  ctx.save();
  const [ox, oy] = shakeOffset();
  ctx.translate(ox, oy);
  background(ctx, t);
  state.islands.forEach((s, i) => island(ctx, s, t, i));
  state.gems.forEach((g, i) => { if (!g.taken) gem(ctx, g, t, i); });
  state.storms.forEach((c, i) => storm(ctx, c, t, i));
  if (phase !== "over") hero(ctx, state.player, phase, t);
  for (const p of fx.parts) {
    ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  for (const r of fx.rings) {
    const f = 1 - r.life / r.max;
    ctx.globalAlpha = 1 - f; ctx.strokeStyle = r.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (0.3 + f), 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const p of fx.pops) {
    const f = p.life / p.max;
    ctx.globalAlpha = Math.min(1, f * 2);
    text(ctx, p.text, p.x, p.y, 20 + (f > 0.85 ? 6 : 0), p.color, "center");
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  const fa = flashAlpha();
  if (fa > 0) { ctx.globalAlpha = fa; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  ui(ctx, state, data, phase, t);
}
