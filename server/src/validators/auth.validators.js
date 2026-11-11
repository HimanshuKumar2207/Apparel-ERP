import { z } from 'zod';
import { email, password } from './common.js';

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
  otp: z.string().regex(/^\d{6}$/).optional(),
});
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password,
});
export const otpSchema = z.object({ otp: z.string().regex(/^\d{6}$/, 'Enter the 6 digit code') });
export const disable2faSchema = z.object({ password: z.string().min(1).max(128), otp: z.string().regex(/^\d{6}$/) });
