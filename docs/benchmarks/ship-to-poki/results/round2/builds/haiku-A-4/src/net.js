const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top";

// Returns [] on any failure so a dead leaderboard never blocks the game.
export async function fetchTopScores() {
  try {
    const res = await fetch(LEADERBOARD);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Leaderboard unavailable", err);
    return [];
  }
}
