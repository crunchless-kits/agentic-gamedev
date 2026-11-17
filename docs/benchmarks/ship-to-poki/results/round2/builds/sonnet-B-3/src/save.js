const KEY = "skyhop-save";
const defaults = () => ({ best: 0, gems: 0 });

export function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    if (parsed && Number.isFinite(parsed.best) && Number.isFinite(parsed.gems)) return parsed;
  } catch (err) {
    // Storage blocked (incognito) or corrupt save: fall back to defaults.
  }
  return defaults();
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    // Storage unavailable: progress lasts for this session only.
  }
}
