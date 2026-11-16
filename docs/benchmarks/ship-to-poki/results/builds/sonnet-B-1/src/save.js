const KEY = "skyhop-save";

export function load() {
  const fresh = { best: 0, gems: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...fresh, ...JSON.parse(raw) } : fresh;
  } catch {
    return fresh; // storage blocked in the iframe, or corrupt save
  }
}

export function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
}
