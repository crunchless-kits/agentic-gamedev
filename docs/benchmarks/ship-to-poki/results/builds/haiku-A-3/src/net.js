// Leaderboard is optional: if it is unreachable (blocked, offline, or served
// over http from an https page) the game runs with no top score.
const LEADERBOARD = "http://scores.lumengames.example.com/skyhop/top";

export async function fetchTopScores() {
  try {
    const res = await fetch(LEADERBOARD, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Leaderboard unavailable", err);
    return [];
  }
}
