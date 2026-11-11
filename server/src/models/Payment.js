import mongoose from 'mongoose';
import { basePlugin } from './plugins.js';

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    party: { type: Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
    amount: { type: Number, required: true, min: 1 }, // paise
    mode: { type: String, enum: ['cash', 'upi', 'bank', 'cheque'], default: 'bank' },
    referenceNo: { type: String, trim: true, maxlength: 60 },
    date: { type: Date, required: true, index: true },
    note: { type: String, maxlength: 200 },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);
paymentSchema.plugin(basePlugin);
export const Payment = mongoose.model('Payment', paymentSchema);
