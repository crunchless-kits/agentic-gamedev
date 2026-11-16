// Poki blocks external requests by default; only an approved endpoint (Settings → CSP) may be called.
// Keep this off for the portal build until that approval exists. The endpoint must be https.
const LEADERBOARD_ENABLED = false;
const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top"; // TODO: confirm real host and approval
const TIMEOUT_MS = 3000;

export async function fetchTopScores() {
  if (!LEADERBOARD_ENABLED) return [];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(LEADERBOARD, { signal: ctrl.signal });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn("leaderboard unavailable:", err);
    return [];
  } finally {
    clearTimeout(timer);
  }
}
