const KEY = "skyhop-save";
const DEFAULT = { best: 0, gems: 0 };

// Storage can throw (blocked in embedded iframes) and saves can be corrupt: never crash.
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch (e) {
    return { ...DEFAULT };
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    // Progress is lost for this session only.
  }
}
