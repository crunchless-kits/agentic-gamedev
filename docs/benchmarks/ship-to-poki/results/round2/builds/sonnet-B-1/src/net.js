// Optional leaderboard. Poki blocks external requests unless approved (Poki for Developers, Settings, CSP),
// so this must never block boot and fails to an empty list.
const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top";

export async function fetchTopScores() {
  try {
    const res = await fetch(LEADERBOARD);
    const j = await res.json();
    return Array.isArray(j) ? j : [];
  } catch (e) {
    return [];
  }
}
