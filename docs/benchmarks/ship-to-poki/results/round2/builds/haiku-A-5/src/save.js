const KEY = "skyhop-save";

// localStorage can throw (privacy modes, sandboxed iframes); fall back to defaults.
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { best: 0, gems: 0 };
  } catch {
    return { best: 0, gems: 0 };
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Saving is best-effort.
  }
}
