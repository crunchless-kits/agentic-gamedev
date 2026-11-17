const KEY = "skyhop-save";
const defaults = () => ({ best: 0, gems: 0 });

// localStorage can throw (incognito, sandboxed frame) and saves can be corrupt.
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const d = raw ? JSON.parse(raw) : null;
    if (d && Number.isFinite(d.best) && Number.isFinite(d.gems)) return { best: d.best, gems: d.gems };
  } catch (e) {
    // fall through to defaults
  }
  return defaults();
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    // storage unavailable: keep playing without persistence
  }
}
