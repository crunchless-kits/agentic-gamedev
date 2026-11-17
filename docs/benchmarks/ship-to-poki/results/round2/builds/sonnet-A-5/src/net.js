// The game must not depend on third-party servers on the portal. The
// leaderboard is optional: it is fetched over HTTPS with a timeout, and any
// failure just yields an empty list.
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
