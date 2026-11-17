// Audio. Files may be missing from a build; every play is guarded so a missing or
// blocked file never throws or leaves an unhandled rejection.
const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
const all = [music, ...Object.values(sounds)];

function quietPlay(el) {
  try {
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {
    // Audio unavailable; the game continues silently.
  }
}

// Mute everything (ad breaks, hidden tab). Playback state is kept.
export function setMuted(on) {
  for (const el of all) el.muted = on;
}

// Call from a player input (browsers block audio before a gesture).
export function startMusic() {
  quietPlay(music);
}

export function play(name) {
  const s = sounds[name];
  if (!s) return;
  try {
    s.currentTime = 0;
  } catch {
    // Some browsers reject seeking before metadata loads; play anyway.
  }
  quietPlay(s);
}
