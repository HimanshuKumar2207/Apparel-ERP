import mongoose from 'mongoose';
import { basePlugin } from './plugins.js';

const { Schema } = mongoose;

const partySchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    city: { type: String, trim: true, maxlength: 60 },
    region: { type: String, trim: true, maxlength: 60, index: true },
    state: { type: String, trim: true, maxlength: 60 },
    gstNumber: { type: String, trim: true, uppercase: true },
    contacts: [{ _id: false, name: String, phone: String, email: String }],
    creditLimit: { type: Number, min: 0, default: 0 }, // paise, 0 = no limit
    paymentTermsDays: { type: Number, min: 0, max: 365, default: 30 },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Employee', default: null, index: true },
    // Which brands this party sells, with its own discount
    brands: [{ _id: false, brand: { type: Schema.Types.ObjectId, ref: 'Brand' }, discountPct: { type: Number, min: 0, max: 100, default: 0 } }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);
partySchema.index({ code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
partySchema.plugin(basePlugin);
export const Party = mongoose.model('Party', partySchema);
