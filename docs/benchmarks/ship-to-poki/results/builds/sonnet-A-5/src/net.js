// Poki games should not depend on external servers; the leaderboard is optional and fails soft.
const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top";

export async function fetchTopScores() {
  try {
    const res = await fetch(LEADERBOARD);
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j) ? j : [];
  } catch (e) { return []; }
}
