const KEY = "skyhop-save";
const DEFAULT = { best: 0, gems: 0 };

// localStorage can be unavailable (blocked storage in iframes) or hold bad JSON.
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
    // Storage unavailable: progress lasts for this session only.
  }
}
