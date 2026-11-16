const KEY = "skyhop-save";
const DEFAULT = { best: 0, gems: 0 };

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    // Storage can be unavailable (blocked cookies) or hold corrupt data.
    return { ...DEFAULT };
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Ignore: the game still works without persistence.
  }
}
