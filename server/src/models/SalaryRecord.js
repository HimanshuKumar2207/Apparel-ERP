import mongoose from 'mongoose';
import { basePlugin } from './plugins.js';

const { Schema } = mongoose;

const salarySchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    daysInMonth: Number,
    payableDays: Number,
    basic: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    gross: { type: Number, default: 0 },
    incentive: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    advances: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'approved', 'paid'], default: 'draft', index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    paidAt: Date,
    note: { type: String, maxlength: 200 },
  },
  { timestamps: true },
);
salarySchema.index({ employee: 1, month: 1 }, { unique: true });
salarySchema.methods.recalc = function recalc() {
  this.gross = Math.round(((this.basic + this.allowances) * this.payableDays) / this.daysInMonth);
  this.net = Math.max(0, this.gross + this.incentive - this.deductions - this.advances);
};
salarySchema.plugin(basePlugin);
export const SalaryRecord = mongoose.model('SalaryRecord', salarySchema);
