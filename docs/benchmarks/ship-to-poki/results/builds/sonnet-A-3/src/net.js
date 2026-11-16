// Poki games should not depend on external servers; the leaderboard is optional and fails soft.
const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top";

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
