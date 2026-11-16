const KEY = "skyhop-save";
const DEFAULTS = { best: 0, gems: 0 };

// Storage can be blocked (private modes, embedded frames); the game must stay playable.
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Not saved this session; play continues.
  }
}
