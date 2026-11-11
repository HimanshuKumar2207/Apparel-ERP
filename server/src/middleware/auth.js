import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccess } from '../services/token.service.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { can } from '../services/permissions.service.js';

/** Verifies the bearer token, loads the user and applies forced-password-change / forced-2FA gates. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Authentication required', { code: 'UNAUTHENTICATED' });

  let payload;
  try {
    payload = verifyAccess(header.slice(7));
  } catch (e) {
    throw new ApiError(401, e.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid token', { code: 'TOKEN_INVALID' });
  }

  const user = await User.findById(payload.sub);
  if (!user || user.isDeleted || user.status !== 'active') throw new ApiError(401, 'Account unavailable', { code: 'TOKEN_INVALID' });

  // Tokens issued before the last password change are no longer valid.
  if ((payload.pca || 0) !== (user.passwordChangedAt ? user.passwordChangedAt.getTime() : 0)) {
    throw new ApiError(401, 'Please sign in again', { code: 'TOKEN_INVALID' });
  }

  const inAuthArea = req.originalUrl.startsWith('/api/v1/auth/');
  if (!inAuthArea) {
    if (user.mustChangePassword) throw new ApiError(403, 'You must change your password first', { code: 'PASSWORD_CHANGE_REQUIRED' });
    if (env.REQUIRE_2FA_SUPER_ADMIN && user.role === 'superAdmin' && !user.twoFactor?.enabled) {
      throw new ApiError(403, 'Two-factor authentication must be enabled for Super Admins', { code: '2FA_SETUP_REQUIRED' });
    }
  }
  req.user = user;
  next();
});

/** Route guard: user must hold `action` on `module`. */
export const authorize = (module, action) => (req, _res, next) =>
  can(req.user, module, action)
    ? next()
    : next(new ApiError(403, 'You do not have permission to do this', { code: 'FORBIDDEN' }));

export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user.role) ? next() : next(new ApiError(403, 'Not allowed for your role', { code: 'FORBIDDEN' }));
