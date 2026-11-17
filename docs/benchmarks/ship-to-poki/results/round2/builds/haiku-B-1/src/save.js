// Local save. Storage can be unavailable (private windows, sandboxed frames) or hold
// corrupt data; both fall back to defaults so the game still runs.
const KEY = "skyhop-save";

export function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
    if (parsed && Number.isFinite(parsed.best) && Number.isFinite(parsed.gems)) {
      return { best: parsed.best, gems: parsed.gems };
    }
  } catch {
    // Fall through to defaults.
  }
  return { best: 0, gems: 0 };
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage blocked; progress lasts for this session only.
  }
}
