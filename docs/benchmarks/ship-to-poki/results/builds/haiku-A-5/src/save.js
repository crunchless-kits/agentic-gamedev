const KEY = "skyhop-save";
const DEFAULT = { best: 0, gems: 0 };

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    // Corrupt save or storage disabled: start fresh instead of crashing.
    return { ...DEFAULT };
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage may be unavailable (e.g. blocked third-party storage).
  }
}
