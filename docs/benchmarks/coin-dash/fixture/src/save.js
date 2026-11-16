const KEY = "coin-dash-best";

export function loadBest() {
  return Number(localStorage.getItem(KEY)) || 0;
}

export function saveBest(value) {
  localStorage.setItem(KEY, String(value));
}
