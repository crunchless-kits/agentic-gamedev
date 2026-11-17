// Leaderboard is optional: Poki builds must not depend on external hosts, and http:// is blocked as mixed content on https.
const LEADERBOARD = "";

export async function fetchTopScores() {
  if (!LEADERBOARD) return [];
  try {
    const res = await fetch(LEADERBOARD);
    return res.ok ? await res.json() : [];
  } catch (e) { return []; }
}
