const KEY = "skyhop-save";
const defaults = () => ({ best: 0, gems: 0 });

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && Number.isFinite(d.best) && Number.isFinite(d.gems)) return { best: d.best, gems: d.gems };
  } catch (e) { /* storage blocked or corrupt */ }
  return defaults();
}

export function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* incognito: keep playing */ }
}
