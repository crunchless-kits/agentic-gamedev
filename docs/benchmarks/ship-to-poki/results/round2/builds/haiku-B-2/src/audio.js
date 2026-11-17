const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;

// Browsers may block playback (no user gesture yet, or missing file). Never throw or leave a rejection.
function quietPlay(a) {
  try {
    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {
    // ignore
  }
}

export function startMusic() {
  music.muted = muted;
  quietPlay(music);
}

export function pauseMusic() {
  music.pause();
}

export function resumeMusic() {
  quietPlay(music);
}

export function setMuted(on) {
  muted = on;
  music.muted = on;
  for (const s of Object.values(sounds)) s.muted = on;
}

export function play(name) {
  const s = sounds[name];
  if (!s) return;
  try { s.currentTime = 0; } catch { /* not loaded yet */ }
  s.muted = muted;
  quietPlay(s);
}
