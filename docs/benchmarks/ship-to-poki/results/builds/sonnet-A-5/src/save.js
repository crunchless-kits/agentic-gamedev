const KEY = "skyhop-save";
const fresh = () => ({ best: 0, gems: 0 });

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
  } catch (e) { return fresh(); }
}

export function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable (iframe/privacy) */ }
}
