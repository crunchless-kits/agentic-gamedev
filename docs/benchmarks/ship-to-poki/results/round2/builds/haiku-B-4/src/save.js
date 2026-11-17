const KEY = "skyhop-save";

function defaults() {
  return { best: 0, gems: 0 };
}

// Storage can be blocked (private mode, embedded frames) or hold corrupt data.
// Either way the game starts with defaults instead of failing.
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const v = JSON.parse(raw);
    if (v && Number.isFinite(v.best) && Number.isFinite(v.gems)) return { best: v.best, gems: v.gems };
    return defaults();
  } catch {
    return defaults();
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable: keep playing without saving.
  }
}
