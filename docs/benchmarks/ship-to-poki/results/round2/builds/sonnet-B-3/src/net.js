// Optional leaderboard. Poki blocks external requests unless the host is approved
// (Poki for Developers > Settings > CSP), so this must never block or break play.
const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top";
const TIMEOUT_MS = 3000;

export async function fetchTopScores() {
  try {
    const res = await fetch(LEADERBOARD, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}
