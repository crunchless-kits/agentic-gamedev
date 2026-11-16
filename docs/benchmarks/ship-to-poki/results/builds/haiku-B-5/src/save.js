const KEY = "skyhop-save";
const DEFAULTS = { best: 0, gems: 0 };

// Storage can throw (blocked in sandboxed or private contexts). Saving is best effort:
// the game runs without it rather than failing to start.
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return { ...DEFAULTS, ...(parsed && typeof parsed === "object" ? parsed : {}) };
  } catch (err) {
    return { ...DEFAULTS };
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    // Ignored: the run continues without persisting.
  }
}
