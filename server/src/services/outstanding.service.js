import { Booking } from '../models/Booking.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { ACHIEVED_STATUSES } from '../config/permissions.js';

/**
 * Outstanding (paise) per party =
 *   issued invoices (GST inclusive) + confirmed bookings not yet invoiced (ex-GST) - payments received.
 * Returns Map<partyId, number>.
 */
export async function outstandingByParty(partyIds) {
  const scope = partyIds ? { party: { $in: partyIds } } : {};
  const [bookings, invoices, paid] = await Promise.all([
    Booking.aggregate([
      { $match: { isDeleted: false, status: { $in: ACHIEVED_STATUSES }, invoice: null, ...scope } },
      { $group: { _id: '$party', total: { $sum: '$totalAmount' } } },
    ]),
    Invoice.aggregate([
      { $match: { isDeleted: false, status: 'issued', ...scope } },
      { $group: { _id: '$party', total: { $sum: '$total' } } },
    ]),
    Payment.aggregate([
      { $match: { isDeleted: false, ...scope } },
      { $group: { _id: '$party', total: { $sum: '$amount' } } },
    ]),
  ]);
  const map = new Map();
  const add = (id, v) => map.set(String(id), (map.get(String(id)) || 0) + v);
  for (const b of bookings) add(b._id, b.total);
  for (const i of invoices) add(i._id, i.total);
  for (const p of paid) add(p._id, -p.total);
  return map;
}
