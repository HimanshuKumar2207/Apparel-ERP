import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { randomToken, sha256 } from '../utils/crypto.js';

const ISSUER = 'apparel-erp';
const AUDIENCE = 'erp-client';
export const REFRESH_COOKIE = 'refresh_token';

export const signAccess = (user) =>
  // `pca` pins the token to the current password version: changing the password invalidates every older token exactly.
  jwt.sign({ role: user.role, pca: user.passwordChangedAt ? user.passwordChangedAt.getTime() : 0 }, env.JWT_ACCESS_SECRET, {
    subject: String(user._id),
    expiresIn: env.ACCESS_TTL,
    issuer: ISSUER,
    audience: AUDIENCE,
  });

export const verifyAccess = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: ISSUER, audience: AUDIENCE });

export const verifyRefresh = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: ISSUER });

/** Creates a refresh token and stores only its hash (newest 10 sessions kept). */
export async function issueRefresh(user) {
  const jti = randomToken(24);
  const token = jwt.sign({ jti }, env.JWT_REFRESH_SECRET, {
    subject: String(user._id),
    expiresIn: `${env.REFRESH_TTL_DAYS}d`,
    issuer: ISSUER,
  });
  await User.updateOne({ _id: user._id }, { $push: { refreshTokens: { $each: [sha256(jti)], $slice: -10 } } });
  return token;
}

export function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: env.REFRESH_TTL_DAYS * 864e5,
  });
}

export const clearRefreshCookie = (res) =>
  res.clearCookie(REFRESH_COOKIE, { httpOnly: true, secure: env.cookieSecure, sameSite: 'strict', path: '/api/v1/auth' });
