const KEY = "skyhop-save";

function defaults() {
  return { best: 0, gems: 0 };
}

// Storage can be blocked (incognito, embedded frames) or hold bad JSON. The game must still run.
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
  } catch (e) {
    return defaults();
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    // storage unavailable: keep playing without saving
  }
}
