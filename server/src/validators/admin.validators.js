import { z } from 'zod';
import { ACTIONS, ADMIN_GRANTABLE } from '../config/permissions.js';
import { email, objectId, password } from './common.js';

const permissions = z
  .record(z.enum(ADMIN_GRANTABLE), z.array(z.enum(ACTIONS)).max(5).transform((a) => [...new Set(a)]))
  .default({});
const scope = z
  .object({
    brands: z.array(objectId).max(100).default([]),
    regions: z.array(z.string().trim().min(1).max(60)).max(100).default([]),
  })
  .default({});

export const createAdminSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password,
  permissions,
  scope,
});
export const updateAdminSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  permissions: permissions.optional(),
  scope: scope.optional(),
  status: z.enum(['active', 'disabled']).optional(),
});
export const resetPasswordSchema = z.object({ password });
export const employeeLoginSchema = z.object({ email, password });
