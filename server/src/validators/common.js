import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const refId = objectId.nullable().optional();
export const money = z.number().int().min(0).max(1e12); // paise
export const optionalText = (max = 200) => z.string().trim().max(max).optional();
export const dateInput = z.coerce.date();
export const status = z.enum(['active', 'inactive']);
export const phone = z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, 'Invalid phone number');
export const gstin = z.string().trim().toUpperCase().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'Invalid GSTIN');

/** Strong password policy: 10+ chars, upper, lower, digit, symbol. */
export const password = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(128)
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/\d/, 'Add a number')
  .regex(/[^A-Za-z0-9]/, 'Add a symbol');

export const email = z.string().trim().toLowerCase().email().max(120);
export const partial = (schema) => schema.partial();
