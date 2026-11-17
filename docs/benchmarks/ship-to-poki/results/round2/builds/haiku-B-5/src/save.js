const KEY = "skyhop-save";

function defaults() {
  return { best: 0, gems: 0 };
}

// localStorage can throw (incognito, blocked storage) or hold bad JSON. The
// game must stay playable either way, so fall back to defaults and skip writes.
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
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
