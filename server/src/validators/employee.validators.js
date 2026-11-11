import { z } from 'zod';
import { money, phone, refId, objectId, email } from './common.js';

const brandLink = z.object({ brand: objectId, subBrand: refId });

export const employeeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().max(20).optional(),
  phone: phone.optional(),
  email: email.optional(),
  address: z.string().trim().max(300).optional(),
  designation: z.string().trim().max(80).optional(),
  joiningDate: z.coerce.date().optional(),
  reportingTo: refId,
  status: z.enum(['active', 'inactive']).optional(),
  brands: z.array(brandLink).max(50).optional(),
  salary: z.object({ basic: money.optional(), allowances: money.optional(), deductions: money.optional() }).optional(),
  bank: z
    .object({
      holder: z.string().trim().max(100).optional(),
      ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC').optional(),
      accountNumber: z.string().trim().regex(/^\d{6,20}$/, 'Account number must be 6-20 digits').optional(),
    })
    .optional(),
  aadhaarLast4: z.string().regex(/^\d{4}$/, 'Enter only the last 4 digits').optional(),
});
export const employeeUpdateSchema = employeeSchema.partial();
