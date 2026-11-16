const KEY = "skyhop-save";
const EMPTY = { best: 0, gems: 0 };

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    return d && typeof d.best === "number" && typeof d.gems === "number" ? d : { ...EMPTY };
  } catch { return { ...EMPTY }; }
}

export function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage blocked */ }
}
