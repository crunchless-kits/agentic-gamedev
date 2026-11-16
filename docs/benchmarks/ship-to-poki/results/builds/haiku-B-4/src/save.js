// Poki runs games in a frame where localStorage can be blocked (incognito, privacy settings).
// A failed save must never stop the game.
const KEY = "skyhop-save";
const DEFAULT = { best: 0, gems: 0 };

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { ...DEFAULT };
  } catch (err) {
    console.warn("save load failed:", err);
    return { ...DEFAULT };
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("save failed:", err);
  }
}
