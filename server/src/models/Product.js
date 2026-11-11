import mongoose from 'mongoose';
import { basePlugin } from './plugins.js';

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    subBrand: { type: Schema.Types.ObjectId, ref: 'SubBrand', required: true, index: true },
    styleCode: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    season: { type: String, trim: true, maxlength: 40 },
    sizes: [{ type: String, trim: true }],
    colors: [{ type: String, trim: true }],
    mrp: { type: Number, min: 0, default: 0 }, // paise
    dealerPrice: { type: Number, min: 0, default: 0 }, // paise
    // Size-color stock matrix
    stock: [{ _id: false, size: String, color: String, qty: { type: Number, min: 0, default: 0 } }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);
productSchema.index({ styleCode: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
productSchema.virtual('totalStock').get(function () {
  return (this.stock || []).reduce((s, r) => s + (r.qty || 0), 0);
});
productSchema.plugin(basePlugin);
productSchema.set('toJSON', { ...productSchema.get('toJSON'), virtuals: true });
export const Product = mongoose.model('Product', productSchema);
