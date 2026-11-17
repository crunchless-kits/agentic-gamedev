// Poki disallows external network calls and the old endpoint was plain http (blocked as mixed
// content on https). The leaderboard is disabled until a Poki-approved backend exists.
export async function fetchTopScores() {
  return [];
}
