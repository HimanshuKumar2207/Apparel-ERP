import mongoose from 'mongoose';
import { basePlugin } from './plugins.js';

const { Schema } = mongoose;

const lineSchema = new Schema(
  {
    brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
    subBrand: { type: Schema.Types.ObjectId, ref: 'SubBrand', default: null },
    product: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    style: String,
    size: String,
    color: String,
    qty: Number,
    rate: Number, // paise per piece, excluding GST
    discountPct: Number,
    taxable: Number, // paise
    gstRate: Number, // %
    cgst: Number,
    sgst: Number,
    igst: Number,
    total: Number, // taxable + tax
  },
  { _id: false },
);

const partyBlock = { name: String, gstin: String, state: String, city: String, address: String };

const invoiceSchema = new Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    party: { type: Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', index: true },
    brands: [{ type: Schema.Types.ObjectId, ref: 'Brand' }],
    date: { type: Date, required: true, index: true },
    dueDate: Date,
    // Snapshots: an issued invoice never changes even if the party or company details are edited later
    seller: partyBlock,
    buyer: partyBlock,
    supply: { type: String, enum: ['intra', 'inter'], required: true }, // intra = CGST+SGST, inter = IGST
    items: { type: [lineSchema], validate: [(v) => v.length > 0, 'Invoice has no items'] },
    taxable: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    total: { type: Number, default: 0 }, // paise, rounded to the nearest rupee
    status: { type: String, enum: ['issued', 'cancelled'], default: 'issued', index: true },
    cancelledAt: Date,
    cancelReason: String,
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);
// Only one ACTIVE invoice per booking (a cancelled one can be re-issued)
invoiceSchema.index({ booking: 1 }, { unique: true, partialFilterExpression: { status: 'issued' } });
invoiceSchema.plugin(basePlugin);
export const Invoice = mongoose.model('Invoice', invoiceSchema);
