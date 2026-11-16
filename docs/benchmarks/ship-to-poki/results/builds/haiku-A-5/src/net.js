const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top";

// Never throws: a failed or slow leaderboard must not block the game.
export async function fetchTopScores() {
  try {
    const res = await fetch(LEADERBOARD, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}
