const KEY = "skyhop-save";
const DEFAULT = () => ({ best: 0, gems: 0 });
let memory = null; // fallback when localStorage is unavailable (sandboxed iframe, blocked cookies)

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT(), ...JSON.parse(raw) } : DEFAULT();
  } catch (e) {
    return memory || DEFAULT();
  }
}

export function save(data) {
  memory = data;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {}
}
