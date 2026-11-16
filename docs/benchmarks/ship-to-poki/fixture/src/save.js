const KEY = "skyhop-save";

export function load() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : { best: 0, gems: 0 };
}

export function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
