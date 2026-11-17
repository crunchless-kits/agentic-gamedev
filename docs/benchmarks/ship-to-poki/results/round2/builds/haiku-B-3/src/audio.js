const music = new Audio("assets/music.wav");
music.loop = true;
const sounds = { jump: new Audio("assets/jump.wav"), gem: new Audio("assets/gem.wav") };
let muted = false;
let musicWanted = false; // music started by the player and not yet stopped by a hidden tab

// Browsers reject playback without a user gesture or when a file is missing; the game runs silently then.
function quietPlay(el) {
  try {
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {
    // ignore
  }
}

export function setMuted(value) {
  muted = value;
  music.muted = value;
  for (const s of Object.values(sounds)) s.muted = value;
}

export function startMusic() {
  musicWanted = true;
  music.muted = muted;
  quietPlay(music);
}

// Pause everything while the tab is hidden; resume music on return if it was playing.
export function setHidden(hidden) {
  if (hidden) {
    music.pause();
    for (const s of Object.values(sounds)) s.pause();
  } else if (musicWanted) {
    quietPlay(music);
  }
}

export function play(name) {
  const s = sounds[name];
  if (!s) return;
  try {
    s.currentTime = 0;
  } catch (e) {
    // not ready yet; play from the start anyway
  }
  s.muted = muted;
  quietPlay(s);
}
