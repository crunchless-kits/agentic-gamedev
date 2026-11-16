const KEY = "skyhop-save";
const DEFAULT = { best: 0, gems: 0 };

// localStorage can throw (private mode, storage disabled); the game stays playable without it.
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
    // storage unavailable: keep playing without saving
  }
}
