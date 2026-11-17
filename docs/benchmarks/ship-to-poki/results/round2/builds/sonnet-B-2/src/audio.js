// Audio is optional: missing files or blocked autoplay never break the game.
const mk = (src) => { try { return new Audio(src); } catch (e) { return null; } };
const music = mk("assets/music.wav");
if (music) music.loop = true;
const sounds = { jump: mk("assets/jump.wav"), gem: mk("assets/gem.wav") };
let muted = false, wantMusic = false;

function tryPlay(a) {
  try { a.play()?.catch(() => {}); } catch (e) { /* ignore */ }
}

// Call from a user gesture (first key press or tap).
export function startMusic() {
  wantMusic = true;
  if (music && !muted) tryPlay(music);
}

export function setMuted(m) {
  muted = m;
  if (!music) return;
  if (m) music.pause(); else if (wantMusic) tryPlay(music);
}

export function play(name) {
  const s = sounds[name];
  if (!s || muted) return;
  try { s.currentTime = 0; } catch (e) { /* not loaded */ }
  tryPlay(s);
}
