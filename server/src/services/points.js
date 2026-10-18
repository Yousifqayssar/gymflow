// Loyalty points: members earn points for visiting the gym (at most one visit per day).
// Points are calculated from the number of visits, never stored, so they cannot get out of sync.

export const POINTS_PER_VISIT = 10;

// From the lowest to the highest level. Reward: a discount on every new membership
// (the other perks, like a guest pass, are given at the front desk – see the client's levels.js).
export const LEVELS = [
  { name: 'Bronze', from: 0, discountPercent: 0 },
  { name: 'Silver', from: 100, discountPercent: 5 },
  { name: 'Gold', from: 300, discountPercent: 10 },
  { name: 'Platinum', from: 600, discountPercent: 15 },
];

export function pointsForVisits(visits) {
  return visits * POINTS_PER_VISIT;
}

// { visits, points, level, nextLevel, pointsToNextLevel, discountPercent } – nextLevel is null at the top level.
export function pointsSummary(visits) {
  const points = pointsForVisits(visits);
  const levelIndex = LEVELS.findLastIndex((level) => points >= level.from);
  const next = LEVELS[levelIndex + 1] ?? null;

  return {
    visits,
    points,
    level: LEVELS[levelIndex].name,
    nextLevel: next?.name ?? null,
    pointsToNextLevel: next ? next.from - points : 0,
    discountPercent: LEVELS[levelIndex].discountPercent,
  };
}
