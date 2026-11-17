// Leaderboard is optional. Any failure (network, mixed content, timeout) returns
// an empty list so the game still starts.
const LEADERBOARD = "http://scores.lumengames.example.com/skyhop/top";

export async function fetchTopScores() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const res = await fetch(LEADERBOARD, { signal: ctrl.signal });
    if (!res.ok) return [];
    const scores = await res.json();
    return Array.isArray(scores) ? scores : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
