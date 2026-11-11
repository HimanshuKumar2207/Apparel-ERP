import mongoose from 'mongoose';
import { basePlugin } from './plugins.js';

const { Schema } = mongoose;

const targetSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    subBrand: { type: Schema.Types.ObjectId, ref: 'SubBrand', default: null },
    periodType: { type: String, enum: ['month', 'quarter', 'season', 'year'], default: 'month' },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    targetValue: { type: Number, min: 0, default: 0 }, // paise
    targetQty: { type: Number, min: 0, default: 0 },
    note: { type: String, maxlength: 200 },
  },
  { timestamps: true },
);
targetSchema.pre('validate', function check(next) {
  if (this.periodEnd < this.periodStart) return next(new Error('periodEnd must be after periodStart'));
  next();
});
targetSchema.plugin(basePlugin);
export const Target = mongoose.model('Target', targetSchema);
