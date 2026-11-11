import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.path}`));

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    const errors = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return res.status(422).json({ message: errors[0] ? `${errors[0].path ? errors[0].path + ': ' : ''}${errors[0].message}` : 'Validation failed', errors });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, code: err.code, errors: err.errors });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    return res.status(409).json({ message: `A record with this ${field} already exists`, code: 'DUPLICATE' });
  }
  if (err?.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return res.status(422).json({ message: errors[0]?.message || 'Validation failed', errors });
  }
  if (err?.name === 'CastError') return res.status(400).json({ message: `Invalid ${err.path || 'value'}` });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ message: 'Request body too large' });
  if (err?.message === 'Audit logs are append-only') return res.status(403).json({ message: err.message });

  logger.error(`${req.method} ${req.originalUrl}`, err);
  return res.status(500).json({ message: env.isProd ? 'Something went wrong' : err.message });
}
