const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top";

// Optional: never blocks or breaks the game if the request fails.
export async function fetchTopScores() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 3000);
    const res = await fetch(LEADERBOARD, { signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j) ? j : [];
  } catch (e) {
    return [];
  }
}
