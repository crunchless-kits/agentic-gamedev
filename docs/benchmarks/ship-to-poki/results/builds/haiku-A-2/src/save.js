const KEY = "skyhop-save";
const DEFAULTS = { best: 0, gems: 0 };

// localStorage can throw (privacy modes, disabled storage). The game must still run then.
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
    // Progress just won't persist in this session.
  }
}
