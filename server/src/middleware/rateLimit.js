import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit: env.isTest ? 10000 : limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message },
  });

export const apiLimiter = make(15 * 60 * 1000, 1000, 'Too many requests, please slow down');
export const loginLimiter = make(15 * 60 * 1000, 10, 'Too many login attempts, try again in 15 minutes');
export const refreshLimiter = make(15 * 60 * 1000, 120, 'Too many refresh attempts');
