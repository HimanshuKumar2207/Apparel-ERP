import mongoose from 'mongoose';
import { BOOKING_STATUSES } from '../config/permissions.js';
import { basePlugin } from './plugins.js';
import { monthKeyOf, round } from '../utils/helpers.js';

const { Schema } = mongoose;

const itemSchema = new Schema(
  {
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', default: null }, // optional: enables stock deduction at invoicing
    subBrand: { type: Schema.Types.ObjectId, ref: 'SubBrand', default: null },
    style: { type: String, trim: true, maxlength: 80 },
    size: { type: String, trim: true, maxlength: 20 },
    color: { type: String, trim: true, maxlength: 30 },
    qty: { type: Number, required: true, min: 1, max: 1000000 },
    rate: { type: Number, required: true, min: 0 }, // paise per piece
    discountPct: { type: Number, min: 0, max: 100, default: 0 },
    amount: { type: Number, default: 0 }, // paise, computed
  },
  { _id: false },
);

const bookingSchema = new Schema(
  {
    bookingNo: { type: String, required: true, unique: true },
    party: { type: Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    date: { type: Date, required: true, index: true },
    deliveryDate: Date,
    status: { type: String, enum: BOOKING_STATUSES, default: 'booked', index: true },
    items: { type: [itemSchema], validate: [(v) => v.length > 0, 'At least one item is required'] },
    brands: [{ type: Schema.Types.ObjectId, ref: 'Brand' }], // denormalised for scoping
    totalAmount: { type: Number, default: 0 }, // paise, computed
    totalQty: { type: Number, default: 0 },
    monthKey: { type: String, index: true },
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', default: null }, // set while an active invoice exists
    approvalStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none', index: true },
    approvalReason: String,
    approvalNote: String,
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

bookingSchema.pre('validate', function computeTotals(next) {
  let total = 0;
  let qty = 0;
  for (const i of this.items) {
    i.amount = round(i.qty * i.rate * (1 - (i.discountPct || 0) / 100));
    total += i.amount;
    qty += i.qty;
  }
  this.totalAmount = total;
  this.totalQty = qty;
  this.brands = [...new Set(this.items.map((i) => String(i.brand)))];
  if (this.date) this.monthKey = monthKeyOf(this.date);
  next();
});

bookingSchema.plugin(basePlugin);
export const Booking = mongoose.model('Booking', bookingSchema);
