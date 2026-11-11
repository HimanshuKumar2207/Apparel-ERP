import mongoose from 'mongoose';
import { basePlugin } from './plugins.js';

const { Schema } = mongoose;

const employeeSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true, maxlength: 300 },
    designation: { type: String, trim: true, maxlength: 80 },
    joiningDate: Date,
    reportingTo: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    // Brands / sub-brands this employee manages or sells
    brands: [{ _id: false, brand: { type: Schema.Types.ObjectId, ref: 'Brand' }, subBrand: { type: Schema.Types.ObjectId, ref: 'SubBrand', default: null } }],
    salary: {
      basic: { type: Number, min: 0, default: 0 }, // paise / month
      allowances: { type: Number, min: 0, default: 0 },
      deductions: { type: Number, min: 0, default: 0 },
    },
    bank: {
      holder: String,
      ifsc: { type: String, uppercase: true },
      accountEnc: String, // AES-256-GCM encrypted, never returned by the API
      last4: String,
    },
    aadhaarLast4: { type: String, match: /^\d{4}$/ }, // never store the full number
  },
  { timestamps: true },
);
employeeSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
employeeSchema.plugin(basePlugin, { hide: ['bank.accountEnc'] });
export const Employee = mongoose.model('Employee', employeeSchema);
