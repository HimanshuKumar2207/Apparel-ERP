import mongoose from 'mongoose';
import { basePlugin } from './plugins.js';

const { Schema } = mongoose;

const brandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 12 },
    gstRate: { type: Number, min: 0, max: 40, default: 5 },
    defaultDiscount: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);
brandSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
brandSchema.plugin(basePlugin);
export const Brand = mongoose.model('Brand', brandSchema);

const subBrandSchema = new Schema(
  {
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    gender: { type: String, enum: ['men', 'women', 'kids', 'unisex'], default: 'unisex' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);
subBrandSchema.plugin(basePlugin);
export const SubBrand = mongoose.model('SubBrand', subBrandSchema);
