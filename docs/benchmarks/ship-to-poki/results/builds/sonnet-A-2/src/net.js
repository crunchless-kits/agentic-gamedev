const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top";

// Never throws and never blocks the game: returns [] on any failure.
export async function fetchTopScores() {
  try {
    const res = await fetch(LEADERBOARD);
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j) ? j : [];
  } catch (e) {
    return [];
  }
}
