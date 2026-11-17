const KEY = "skyhop-save";

// localStorage can throw (blocked storage, quota) and the saved JSON can be corrupt.
export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    return { best: d?.best ?? 0, gems: d?.gems ?? 0 };
  } catch {
    return { best: 0, gems: 0 };
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Progress just won't persist this session.
  }
}
