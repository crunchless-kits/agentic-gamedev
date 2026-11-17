// TODO(poki): Poki blocks external requests by default. The leaderboard host
// must be approved (Poki for Developers > Settings > CSP) or this removed.
const LEADERBOARD = "https://scores.lumengames.example.com/skyhop/top";
const TIMEOUT_MS = 3000;

// Never throws and never blocks boot: returns [] on any failure.
export async function fetchTopScores() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    const res = await fetch(LEADERBOARD, { signal: ctl.signal });
    clearTimeout(t);
    const list = await res.json();
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}
