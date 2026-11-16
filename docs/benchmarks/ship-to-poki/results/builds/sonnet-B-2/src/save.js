const KEY = "skyhop-save";
const fresh = () => ({ best: 0, gems: 0 });

// localStorage throws in incognito / blocked-storage contexts, so every access is guarded.
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
  } catch (e) {
    return fresh();
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    // progress lasts this session only
  }
}
