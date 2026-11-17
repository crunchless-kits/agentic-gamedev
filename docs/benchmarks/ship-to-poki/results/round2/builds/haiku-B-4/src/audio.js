// Audio files are loaded lazily by the browser. A missing or unplayable file logs a
// warning and the game carries on silently.
const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };

let started = false;
let muted = false;
let pausedByHost = false;

function attempt(audio) {
  try {
    const p = audio.play();
    if (p && p.catch) p.catch((e) => console.warn("audio not played", audio.src, e));
  } catch (e) {
    console.warn("audio not played", audio.src, e);
  }
}

// Call from a user gesture (first key press or tap).
export function startMusic() {
  if (started) return;
  started = true;
  if (!pausedByHost) attempt(music);
}

export function pauseMusic() {
  pausedByHost = true;
  music.pause();
}

export function resumeMusic() {
  pausedByHost = false;
  if (started && !muted) attempt(music);
}

export function setMuted(on) {
  muted = on;
  music.muted = on;
  for (const s of Object.values(sounds)) s.muted = on;
  if (!on && started && !pausedByHost) attempt(music);
}

export function play(name) {
  const s = sounds[name];
  if (!s || muted) return;
  try { s.currentTime = 0; } catch { /* not loaded yet */ }
  attempt(s);
}
