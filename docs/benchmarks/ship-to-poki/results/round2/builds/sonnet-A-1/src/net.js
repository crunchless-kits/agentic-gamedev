// Optional leaderboard. Must never block or break the game if the request fails.
const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top";

export async function fetchTopScores() {
  try {
    const res = await fetch(LEADERBOARD, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j) ? j : [];
  } catch (e) {
    return [];
  }
}
