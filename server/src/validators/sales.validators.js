import { z } from 'zod';
import { gstin, money, objectId, phone, refId, status, email } from './common.js';

export const partySchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().max(20).optional(),
  city: z.string().trim().max(60).optional(),
  region: z.string().trim().max(60).optional(),
  state: z.string().trim().max(60).optional(),
  gstNumber: gstin.optional(),
  contacts: z.array(z.object({ name: z.string().trim().max(80).optional(), phone: phone.optional(), email: email.optional() })).max(10).optional(),
  creditLimit: money.optional(),
  paymentTermsDays: z.number().int().min(0).max(365).optional(),
  assignedTo: refId,
  brands: z.array(z.object({ brand: objectId, discountPct: z.number().min(0).max(100).optional() })).max(100).optional(),
  status: status.optional(),
});
export const partyUpdateSchema = partySchema.partial();

const item = z.object({
  brand: objectId,
  product: refId,
  subBrand: refId,
  style: z.string().trim().max(80).optional(),
  size: z.string().trim().max(20).optional(),
  color: z.string().trim().max(30).optional(),
  qty: z.number().int().min(1).max(1e6),
  rate: money,
  discountPct: z.number().min(0).max(100).optional(),
}).refine((i) => !i.product || (i.size && i.color), { message: 'Size and color are required when a product is chosen', path: ['size'] });
export const bookingSchema = z.object({
  party: objectId,
  employee: objectId.optional(),
  date: z.coerce.date(),
  deliveryDate: z.coerce.date().optional(),
  status: z.enum(['draft', 'booked']).optional(),
  items: z.array(item).min(1, 'Add at least one item').max(200),
  notes: z.string().trim().max(500).optional(),
});
export const bookingUpdateSchema = bookingSchema.omit({ status: true }).partial();
export const bookingStatusSchema = z.object({ status: z.enum(['booked', 'confirmed', 'dispatched', 'delivered', 'cancelled']) });
export const bookingApprovalSchema = z.object({ decision: z.enum(['approved', 'rejected']), note: z.string().trim().max(300).optional() });

export const targetSchema = z.object({
  employee: objectId,
  brand: objectId,
  subBrand: refId,
  periodType: z.enum(['month', 'quarter', 'season', 'year']).optional(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  targetValue: money.optional(),
  targetQty: z.number().int().min(0).optional(),
  note: z.string().trim().max(200).optional(),
});
export const targetUpdateSchema = targetSchema.partial();

export const paymentSchema = z.object({
  party: objectId,
  amount: z.number().int().min(1).max(1e12),
  mode: z.enum(['cash', 'upi', 'bank', 'cheque']).optional(),
  referenceNo: z.string().trim().max(60).optional(),
  date: z.coerce.date(),
  note: z.string().trim().max(200).optional(),
});
export const paymentUpdateSchema = paymentSchema.partial();

export const invoiceCreateSchema = z.object({ booking: objectId });
export const invoiceCancelSchema = z.object({ reason: z.string().trim().min(3, 'Give a short reason').max(200) });
