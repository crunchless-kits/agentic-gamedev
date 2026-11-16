const KEY = "skyhop-save";
const DEFAULTS = { best: 0, gems: 0 };

// localStorage can be unavailable (incognito, blocked storage) or hold bad JSON.
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable: progress lasts for this session only.
  }
}
