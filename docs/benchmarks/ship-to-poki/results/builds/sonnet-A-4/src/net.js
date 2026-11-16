const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top";

// Optional extra: never let a failing network call block or break the game.
export async function fetchTopScores() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(LEADERBOARD, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j) ? j : [];
  } catch (e) {
    return [];
  }
}
