// Leaderboard. Disabled for the Poki build: Poki blocks external requests by default
// and reviews externally hosted leaderboards case by case. Set the URL here only after
// Poki approves the host under Settings, then CSP. Failures return an empty list.
const LEADERBOARD = null;

export async function fetchTopScores() {
  if (!LEADERBOARD) return [];
  try {
    const res = await fetch(LEADERBOARD);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
