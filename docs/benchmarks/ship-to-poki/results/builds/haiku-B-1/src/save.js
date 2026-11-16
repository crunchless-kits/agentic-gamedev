// localStorage can throw in private or incognito modes, or hold corrupt JSON. The game falls back to defaults and keeps running.
const KEY = "skyhop-save";
const DEFAULT = { best: 0, gems: 0 };

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage is unavailable; the run still plays.
  }
}
