import { z } from 'zod';
import { money, objectId } from './common.js';

export const attendanceSchema = z.object({
  employee: objectId,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  status: z.enum(['present', 'absent', 'halfDay', 'leave']).optional(),
  note: z.string().trim().max(200).optional(),
});
export const attendanceUpdateSchema = attendanceSchema.partial();

export const salaryRunSchema = z.object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM') });
export const salaryUpdateSchema = z.object({
  incentive: money.optional(),
  deductions: money.optional(),
  advances: money.optional(),
  note: z.string().trim().max(200).optional(),
});

export const reportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
