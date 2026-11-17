// Top scores are optional. The game never waits on this request for longer than
// the timeout, and a failure (including Poki blocking external requests) yields [].
const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top";
const TIMEOUT_MS = 3000;

export async function fetchTopScores() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(LEADERBOARD, { signal: ctrl.signal });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
