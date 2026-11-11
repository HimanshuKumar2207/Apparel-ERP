import { INCENTIVE_SLABS } from '../config/permissions.js';

/** Achievement % -> incentive rate (fraction of achieved value). */
export function incentiveRate(percent, slabs = INCENTIVE_SLABS) {
  const sorted = [...slabs].sort((a, b) => b.min - a.min);
  return sorted.find((s) => percent >= s.min)?.rate ?? 0;
}

export const incentiveFor = (achievedValue, percent) => Math.round(achievedValue * incentiveRate(percent));
