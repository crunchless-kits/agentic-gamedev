// Remote leaderboard is disabled for the Poki build. The previous endpoint was
// plain http (blocked as mixed content on Poki's https origin) and an unreviewed
// third-party host. Returns no scores, so the HUD shows "Top -".
export async function fetchTopScores() {
  return [];
}
