export function makeIslands() {
  const islands = [];
  for (let i = 0; i < 8; i++) islands.push({ x: i * 140 + 40, y: 380 - (i % 3) * 70, w: 100, h: 16 });
  return islands;
}

export function makeGems(islands) {
  return islands.map((s) => ({ x: s.x + 40, y: s.y - 30, w: 16, h: 16, taken: false }));
}

export function makeStorms() {
  return [{ x: 300, y: 120, w: 80, h: 40, vx: 2 }, { x: 700, y: 200, w: 90, h: 40, vx: -3 }];
}

export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
