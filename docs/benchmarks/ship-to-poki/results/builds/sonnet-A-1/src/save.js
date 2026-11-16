// localStorage can throw (blocked in some iframes / private modes) and saved
// data can be corrupt, so never let either break the game.
const KEY = "skyhop-save";
const fresh = () => ({ best: 0, gems: 0 });

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const d = raw ? JSON.parse(raw) : null;
    return d && typeof d === "object" ? { ...fresh(), ...d } : fresh();
  } catch (e) {
    return fresh();
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {}
}
