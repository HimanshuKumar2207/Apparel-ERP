import { ACHIEVED_STATUSES } from '../config/permissions.js';
import { Booking } from '../models/Booking.js';
import { Brand } from '../models/Brand.js';
import { Employee } from '../models/Employee.js';
import { Party } from '../models/Party.js';
import { Target } from '../models/Target.js';
import mongoose from 'mongoose';
import { endOfDay } from '../utils/helpers.js';
import { scopeFilter } from './scope.service.js';

/** Common pipeline: confirmed bookings in range, role scope applied, one document per booking item. */
async function baseStages(user, { from, to } = {}) {
  const match = { isDeleted: false, status: { $in: ACHIEVED_STATUSES } };
  if (from || to) match.date = { ...(from && { $gte: new Date(from) }), ...(to && { $lte: endOfDay(to) }) };
  const scope = await scopeFilter(user, 'bookings');
  const stages = [{ $match: { ...match, ...scope } }, { $unwind: '$items' }];
  if (user.role === 'admin' && user.scope?.brands?.length) stages.push({ $match: { 'items.brand': { $in: user.scope.brands } } });
  return stages;
}

const names = async (Model, ids, select = 'name') => {
  const valid = [...new Set(ids.map(String))].filter((i) => mongoose.isValidObjectId(i));
  const docs = await Model.find({ _id: { $in: valid } }).select(select).lean();
  return new Map(docs.map((d) => [String(d._id), d]));
};

export async function brandSales(user, range) {
  const rows = await Booking.aggregate([
    ...(await baseStages(user, range)),
    // two-step group: first per (brand, booking), then per brand, so `bookings` counts distinct bookings
    { $group: { _id: { k: '$items.brand', b: '$_id' }, value: { $sum: '$items.amount' }, qty: { $sum: '$items.qty' } } },
    { $group: { _id: '$_id.k', value: { $sum: '$value' }, qty: { $sum: '$qty' }, bookings: { $sum: 1 } } },
    { $sort: { value: -1 } },
  ]);
  const map = await names(Brand, rows.map((r) => r._id));
  return rows.map((r) => ({ brandId: r._id, brand: map.get(String(r._id))?.name || 'Unknown', value: r.value, qty: r.qty, bookings: r.bookings }));
}

export async function partySales(user, range, limit = 50) {
  const rows = await Booking.aggregate([
    ...(await baseStages(user, range)),
    { $group: { _id: { k: '$party', b: '$_id' }, value: { $sum: '$items.amount' }, qty: { $sum: '$items.qty' } } },
    { $group: { _id: '$_id.k', value: { $sum: '$value' }, qty: { $sum: '$qty' }, bookings: { $sum: 1 } } },
    { $sort: { value: -1 } },
    { $limit: limit },
  ]);
  const map = await names(Party, rows.map((r) => r._id), 'name city region code');
  return rows.map((r) => {
    const p = map.get(String(r._id));
    return { partyId: r._id, party: p?.name || 'Unknown', city: p?.city, region: p?.region, value: r.value, qty: r.qty, bookings: r.bookings };
  });
}

export async function partyBrand(user, range) {
  const rows = await Booking.aggregate([
    ...(await baseStages(user, range)),
    { $group: { _id: { party: '$party', brand: '$items.brand' }, value: { $sum: '$items.amount' }, qty: { $sum: '$items.qty' } } },
    { $sort: { value: -1 } },
    { $limit: 500 },
  ]);
  const [pm, bm] = await Promise.all([
    names(Party, rows.map((r) => r._id.party), 'name city'),
    names(Brand, rows.map((r) => r._id.brand)),
  ]);
  return rows.map((r) => ({
    party: pm.get(String(r._id.party))?.name || 'Unknown',
    city: pm.get(String(r._id.party))?.city,
    brand: bm.get(String(r._id.brand))?.name || 'Unknown',
    value: r.value,
    qty: r.qty,
  }));
}

export async function employeePerformance(user, range) {
  const rows = await Booking.aggregate([
    ...(await baseStages(user, range)),
    { $group: { _id: '$employee', value: { $sum: '$items.amount' }, qty: { $sum: '$items.qty' } } },
    { $sort: { value: -1 } },
  ]);
  const targetFilter = { isDeleted: false, ...(await scopeFilter(user, 'targets')) };
  if (range.from) targetFilter.periodEnd = { $gte: new Date(range.from) };
  if (range.to) targetFilter.periodStart = { $lte: endOfDay(range.to) };
  const targets = await Target.aggregate([
    { $match: targetFilter },
    { $group: { _id: '$employee', target: { $sum: '$targetValue' } } },
  ]);
  const tMap = new Map(targets.map((t) => [String(t._id), t.target]));
  const ids = [...new Set([...rows.map((r) => String(r._id)), ...tMap.keys()])];
  const emap = await names(Employee, ids, 'name code');
  const byId = new Map(rows.map((r) => [String(r._id), r]));
  return ids
    .map((id) => {
      const value = byId.get(id)?.value || 0;
      const target = tMap.get(id) || 0;
      return { employeeId: id, employee: emap.get(id)?.name || 'Unknown', code: emap.get(id)?.code, value, qty: byId.get(id)?.qty || 0, target, percent: target > 0 ? Math.round((value / target) * 1000) / 10 : null };
    })
    .sort((a, b) => b.value - a.value);
}

export async function monthlyTrend(user, range) {
  const rows = await Booking.aggregate([
    ...(await baseStages(user, range)),
    { $group: { _id: '$monthKey', value: { $sum: '$items.amount' }, qty: { $sum: '$items.qty' } } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ month: r._id, value: r.value, qty: r.qty }));
}
