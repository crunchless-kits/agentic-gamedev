// Leaderboard is off for the Poki build: Poki blocks all external requests by default.
// Turn on only after the server is approved for the portal and served over https.
const LEADERBOARD_ENABLED = false;
const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top"; // TODO(verify): real endpoint

export async function fetchTopScores() {
  if (!LEADERBOARD_ENABLED) return [];
  try {
    const res = await fetch(LEADERBOARD);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (err) {
    return [];
  }
}
