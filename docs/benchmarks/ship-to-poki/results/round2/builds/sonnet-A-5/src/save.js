// localStorage can throw (blocked third-party storage in iframes, quota,
// private mode) and saved data can be corrupt. Fall back to memory.
const KEY = "skyhop-save";
const DEFAULT = { best: 0, gems: 0 };
let memory = null;

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { best: Number(d.best) || 0, gems: Number(d.gems) || 0 };
    }
  } catch (e) {}
  return memory ? { ...memory } : { ...DEFAULT };
}

export function save(data) {
  memory = { ...data };
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
}
