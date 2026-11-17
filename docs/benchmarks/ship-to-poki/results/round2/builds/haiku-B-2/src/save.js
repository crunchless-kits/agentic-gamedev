const KEY = "skyhop-save";
const DEFAULTS = { best: 0, gems: 0 };

// localStorage can throw (incognito, sandboxed frames) and saved text can be corrupt.
// Either way the game starts with defaults.
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const d = raw ? JSON.parse(raw) : null;
    return {
      best: Number.isFinite(d?.best) ? d.best : DEFAULTS.best,
      gems: Number.isFinite(d?.gems) ? d.gems : DEFAULTS.gems,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage unavailable: keep playing without saving
  }
}
