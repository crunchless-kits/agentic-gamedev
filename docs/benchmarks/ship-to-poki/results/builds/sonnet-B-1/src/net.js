const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top";

// Optional extra. Never blocks or breaks the game: any failure returns [].
export async function fetchTopScores() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 3000);
    const res = await fetch(LEADERBOARD, { signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}
