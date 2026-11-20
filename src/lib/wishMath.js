
export const PRIMOS_PER_PULL = 160;
export const SOFT_PITY = 74;
export const HARD_PITY = 90;
export const BASE_RATE = 0.006;
export const SOFT_RAMP = 0.06;
export const COMMISSION_PRIMOS = 60;
export const WELKIN_PRIMOS = 90;

export function pullRate(pullNumber) {
  if (pullNumber >= HARD_PITY) return 1;
  if (pullNumber < SOFT_PITY) return BASE_RATE;
  return Math.min(1, BASE_RATE + SOFT_RAMP * (pullNumber - (SOFT_PITY - 1)));
}

export function worstCasePulls(pity, guaranteed) {
  const toHard = HARD_PITY - pity;
  return guaranteed ? toHard : toHard + HARD_PITY;
}

export function featuredProbability(pulls, pity, guaranteed) {
  const n = Math.min(Math.max(0, Math.floor(pulls)), worstCasePulls(pity, guaranteed));
  let notG = new Array(HARD_PITY).fill(0);
  let g = new Array(HARD_PITY).fill(0);
  (guaranteed ? g : notG)[pity] = 1;
  let success = 0;

  for (let i = 0; i < n; i++) {
    const nextNotG = new Array(HARD_PITY).fill(0);
    const nextG = new Array(HARD_PITY).fill(0);
    for (let p = 0; p < HARD_PITY; p++) {
      const rate = pullRate(p + 1);
      const a = notG[p];
      if (a > 0) {
        const hit = a * rate;
        success += hit * 0.5;
        nextG[0] += hit * 0.5;
        if (p + 1 < HARD_PITY) nextNotG[p + 1] += a - hit;
      }
      const b = g[p];
      if (b > 0) {
        const hit = b * rate;
        success += hit;
        if (p + 1 < HARD_PITY) nextG[p + 1] += b - hit;
      }
    }
    notG = nextNotG;
    g = nextG;
  }
  return Math.min(1, success);
}

export function anyFiveStarProbability(pulls, pity) {
  let miss = 1;
  const n = Math.min(Math.max(0, Math.floor(pulls)), HARD_PITY - pity);
  for (let i = 1; i <= n; i++) miss *= 1 - pullRate(pity + i);
  return 1 - miss;
}

export function computeStats({ pity, guaranteed, primogems, fates, commissions, welkin }) {
  const totalPulls = Math.floor(primogems / PRIMOS_PER_PULL) + fates;
  const effectivePity = pity + totalPulls;

  const softNext = Math.max(0, SOFT_PITY - pity);
  const hardNext = HARD_PITY - pity;
  const softFeatured = guaranteed ? softNext : hardNext + SOFT_PITY;
  const hardFeatured = worstCasePulls(pity, guaranteed);

  const featuredChance = featuredProbability(totalPulls, pity, guaranteed);
  const anyChance = anyFiveStarProbability(totalPulls, pity);

  const dailyIncome = (commissions ? COMMISSION_PRIMOS : 0) + (welkin ? WELKIN_PRIMOS : 0);
  const shortfallPulls = Math.max(0, hardFeatured - totalPulls);
  const leftover = primogems % PRIMOS_PER_PULL;
  const primosNeeded = Math.max(0, shortfallPulls * PRIMOS_PER_PULL - leftover);
  const daysToHardPity =
    primosNeeded === 0 ? 0 : dailyIncome > 0 ? Math.ceil(primosNeeded / dailyIncome) : null;

  return {
    totalPulls,
    effectivePity,
    softNext,
    hardNext,
    softFeatured,
    hardFeatured,
    featuredChance,
    anyChance,
    dailyIncome,
    shortfallPulls,
    primosNeeded,
    daysToHardPity,
  };
}
