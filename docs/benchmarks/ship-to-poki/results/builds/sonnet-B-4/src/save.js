const KEY = "skyhop-save";

// localStorage throws in incognito or when blocked; the game must stay playable.
export function load() {
  const fresh = { best: 0, gems: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    const d = raw ? JSON.parse(raw) : null;
    if (d && Number.isFinite(d.best) && Number.isFinite(d.gems)) return d;
  } catch (e) {
    // fall through to a fresh save
  }
  return fresh;
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    // progress this session only
  }
}
