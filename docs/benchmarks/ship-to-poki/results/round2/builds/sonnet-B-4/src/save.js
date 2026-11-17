const KEY = "skyhop-save";

function defaults() { return { best: 0, gems: 0 }; }

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && Number.isFinite(d.best) && Number.isFinite(d.gems)) return d;
  } catch (e) { /* storage blocked or corrupt */ }
  return defaults();
}

export function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage blocked */ }
}
