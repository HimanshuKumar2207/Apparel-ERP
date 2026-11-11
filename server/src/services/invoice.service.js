import { ACHIEVED_STATUSES } from '../config/permissions.js';
import { env } from '../config/env.js';
import { Brand } from '../models/Brand.js';
import { nextCode } from '../models/Counter.js';
import { Invoice } from '../models/Invoice.js';
import { Party } from '../models/Party.js';
import { ApiError } from '../utils/ApiError.js';
import { computeInvoice, financialYear } from './gst.service.js';
import { deductStock, restoreStock } from './stock.service.js';

const norm = (s) => String(s || '').trim().toLowerCase();
export const company = () => ({ name: env.COMPANY_NAME, gstin: env.COMPANY_GSTIN, state: env.COMPANY_STATE, address: env.COMPANY_ADDRESS });

/** Issues a GST invoice for a confirmed booking and deducts stock for product-linked lines. */
export async function issueInvoice(booking, user) {
  if (!ACHIEVED_STATUSES.includes(booking.status)) throw new ApiError(409, 'Only confirmed, dispatched or delivered bookings can be invoiced');
  if (booking.invoice) throw new ApiError(409, 'This booking already has an active invoice');

  const party = await Party.findById(booking.party);
  if (!party) throw new ApiError(404, 'Party not found');
  if (!party.state) throw new ApiError(422, `Set the state on party "${party.name}" first so GST can be calculated`, { code: 'PARTY_STATE_MISSING' });
  const co = company();
  const intra = norm(party.state) === norm(co.state);

  const brands = await Brand.find({ _id: { $in: booking.brands } }).select('gstRate');
  const rates = new Map(brands.map((b) => [String(b._id), b.gstRate]));
  const calc = computeInvoice(booking.items.map((i) => i.toObject()), rates, intra);

  const applied = await deductStock(calc.lines);
  try {
    const fy = financialYear();
    const now = new Date();
    const invoice = await Invoice.create({
      invoiceNo: await nextCode(`INV-${fy}-`, `invoice-${fy}`, 5),
      booking: booking._id, party: party._id, employee: booking.employee, brands: booking.brands,
      date: now, dueDate: new Date(now.getTime() + (party.paymentTermsDays || 0) * 864e5),
      seller: { name: co.name, gstin: co.gstin, state: co.state, address: co.address },
      buyer: { name: party.name, gstin: party.gstNumber, state: party.state, city: party.city },
      supply: intra ? 'intra' : 'inter',
      items: calc.lines, taxable: calc.taxable, cgst: calc.cgst, sgst: calc.sgst, igst: calc.igst, roundOff: calc.roundOff, total: calc.total,
      createdBy: user?._id, updatedBy: user?._id,
    });
    booking.invoice = invoice._id;
    await booking.save();
    return invoice;
  } catch (e) {
    await restoreStock(applied);
    throw e;
  }
}

/** Cancels an invoice, returns stock and re-opens the booking for invoicing. */
export async function cancelInvoice(invoice, booking, user, reason) {
  invoice.status = 'cancelled';
  invoice.cancelledAt = new Date();
  invoice.cancelReason = reason;
  invoice.cancelledBy = user._id;
  await invoice.save();
  await restoreStock(invoice.items.map((i) => i.toObject()));
  if (booking && String(booking.invoice) === String(invoice._id)) {
    booking.invoice = null;
    await booking.save();
  }
}
