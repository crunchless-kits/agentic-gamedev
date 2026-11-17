const KEY = "skyhop-save";
const DEFAULT = { best: 0, gems: 0 };

// localStorage can throw (blocked storage, private mode) and the stored JSON can
// be corrupt; fall back to defaults in both cases instead of breaking boot.
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
    // Storage unavailable: the run still works, progress just is not kept.
  }
}
