const LEADERBOARD = "http://scores.lumengames.example.com/skyhop/top";

export async function fetchTopScores() {
  const res = await fetch(LEADERBOARD);
  return res.json();
}
