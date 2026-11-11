import { Booking } from '../models/Booking.js';
import { ACHIEVED_STATUSES } from '../config/permissions.js';
import { endOfDay, idOf, oid } from '../utils/helpers.js';

/** Achieved value/qty for one target = confirmed booking items of that employee + brand (+ sub-brand) in the period. */
export async function achievementFor(target) {
  const itemMatch = { 'items.brand': oid(idOf(target.brand)) };
  if (target.subBrand) itemMatch['items.subBrand'] = oid(idOf(target.subBrand));
  const [r] = await Booking.aggregate([
    {
      $match: {
        isDeleted: false,
        status: { $in: ACHIEVED_STATUSES },
        employee: oid(idOf(target.employee)),
        date: { $gte: new Date(target.periodStart), $lte: endOfDay(target.periodEnd) },
      },
    },
    { $unwind: '$items' },
    { $match: itemMatch },
    { $group: { _id: null, value: { $sum: '$items.amount' }, qty: { $sum: '$items.qty' } } },
  ]);
  const achievedValue = r?.value || 0;
  const achievedQty = r?.qty || 0;
  const percent = target.targetValue > 0
    ? Math.round((achievedValue / target.targetValue) * 1000) / 10
    : target.targetQty > 0 ? Math.round((achievedQty / target.targetQty) * 1000) / 10 : 0;
  return { achievedValue, achievedQty, percent };
}

export async function attachAchievement(targets) {
  const results = await Promise.all(targets.map((t) => achievementFor(t)));
  return targets.map((t, i) => ({ ...t, ...results[i] }));
}
