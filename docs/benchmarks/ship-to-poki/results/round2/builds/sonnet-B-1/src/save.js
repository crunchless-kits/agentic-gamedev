const KEY = "skyhop-save";
const fresh = () => ({ best: 0, gems: 0 });

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && Number.isFinite(d.best) && Number.isFinite(d.gems)) return d;
  } catch (e) { /* storage blocked or corrupt */ }
  return fresh();
}

export function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* incognito: stay playable */ }
}
