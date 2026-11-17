// Fixed-step effects: particles, rings, popups, shake, flash, hit-stop.
// Everything advances in tick() (60 Hz) so it is frame-rate independent.
import { feel } from "./feel.js";

const MS = 1000 / 60;
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const k = reduced ? feel.reducedScale : 1;

const parts = [];   // {x,y,vx,vy,life,max,size,color,g}
const rings = [];   // {x,y,life,max,r,color}
const pops = [];    // {x,y,life,max,text,color}
let shakeT = 0, shakeMax = 1, shakeMag = 0, flashT = 0, flashMax = 1, stopT = 0;

export const fx = { parts, rings, pops };

export function burst(x, y, n, color, speed = 3, g = 0.12, size = 4) {
  for (let i = 0; i < n && parts.length < feel.maxParticles; i++) {
    const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
    const life = 24 + Math.random() * 22;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.5, life, max: life, size: size * (0.6 + Math.random() * 0.7), color, g });
  }
}
export function dust(x, y, n, color) {
  for (let i = 0; i < n && parts.length < feel.maxParticles; i++) {
    const dir = i % 2 ? 1 : -1, life = 16 + Math.random() * 10;
    parts.push({ x: x + dir * 6, y, vx: dir * (0.8 + Math.random() * 1.6), vy: -Math.random() * 0.8, life, max: life, size: 3 + Math.random() * 2, color, g: 0.02 });
  }
}
export function ring(x, y, r, color) { rings.push({ x, y, life: 18, max: 18, r, color }); }
export function popup(x, y, text, color, ms) { const l = ms / MS; pops.push({ x, y, life: l, max: l, text, color }); }
export function shake(mag, ms) { shakeMag = mag * k; shakeT = shakeMax = ms / MS; }
export function flash(ms) { if (!reduced) flashT = flashMax = ms / MS; }
export function hitStop(ms) { stopT = Math.max(stopT, Math.round((ms * k) / MS)); }

// True while the sim should freeze (consumes one tick of the stop).
export function frozen() { if (stopT > 0) { stopT--; return true; } return false; }

export function tick() {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.98;
    if (--p.life <= 0) { parts[i] = parts[parts.length - 1]; parts.pop(); }
  }
  for (let i = rings.length - 1; i >= 0; i--) if (--rings[i].life <= 0) rings.splice(i, 1);
  for (let i = pops.length - 1; i >= 0; i--) { pops[i].y -= 0.7; if (--pops[i].life <= 0) pops.splice(i, 1); }
  if (shakeT > 0) shakeT--;
  if (flashT > 0) flashT--;
}

export function shakeOffset() {
  if (shakeT <= 0) return [0, 0];
  const m = shakeMag * (shakeT / shakeMax);
  return [(Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m];
}
export function flashAlpha() { return flashT > 0 ? 0.55 * (flashT / flashMax) : 0; }
export function clearFx() { parts.length = rings.length = pops.length = 0; shakeT = flashT = stopT = 0; }
