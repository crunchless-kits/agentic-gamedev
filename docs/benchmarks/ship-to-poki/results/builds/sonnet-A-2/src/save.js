const KEY = "skyhop-save";
const DEFAULT = { best: 0, gems: 0 };

// localStorage can throw (blocked in iframes / private mode) and saved data can be corrupt.
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch (e) {
    return { ...DEFAULT };
  }
}

export function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
}
