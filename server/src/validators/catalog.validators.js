import { z } from 'zod';
import { money, objectId, status } from './common.js';

export const brandSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().toUpperCase().min(2).max(12),
  gstRate: z.number().min(0).max(40).optional(),
  defaultDiscount: z.number().min(0).max(100).optional(),
  status: status.optional(),
});
export const brandUpdateSchema = brandSchema.partial();

export const subBrandSchema = z.object({
  brand: objectId,
  name: z.string().trim().min(2).max(80),
  gender: z.enum(['men', 'women', 'kids', 'unisex']).optional(),
  status: status.optional(),
});
export const subBrandUpdateSchema = subBrandSchema.partial();

export const productSchema = z.object({
  subBrand: objectId,
  styleCode: z.string().trim().toUpperCase().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  season: z.string().trim().max(40).optional(),
  sizes: z.array(z.string().trim().min(1).max(20)).max(30).optional(),
  colors: z.array(z.string().trim().min(1).max(30)).max(30).optional(),
  mrp: money.optional(),
  dealerPrice: money.optional(),
  stock: z.array(z.object({ size: z.string().trim().max(20), color: z.string().trim().max(30), qty: z.number().int().min(0).max(1e7) })).max(500).optional(),
  status: status.optional(),
});
export const productUpdateSchema = productSchema.partial();
