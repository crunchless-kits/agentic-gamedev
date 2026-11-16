const music = new Audio("assets/music.ogg");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
const all = [music, ...Object.values(sounds)];
let started = false;

const safePlay = (a) => { try { const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch { /* blocked */ } };

export function startMusic() { if (started) return; started = true; safePlay(music); }
export function pauseMusic() { music.pause(); }
export function resumeMusic() { if (started) safePlay(music); }
export function setMuted(muted) { for (const a of all) a.muted = muted; }
export function play(name) { const s = sounds[name]; s.currentTime = 0; safePlay(s); }
