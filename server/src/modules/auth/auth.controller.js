import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { decrypt, encrypt, sha256 } from '../../utils/crypto.js';
import { User } from '../../models/User.js';
import { audit } from '../../services/audit.service.js';
import { effectivePermissions } from '../../services/permissions.service.js';
import {
  clearRefreshCookie, issueRefresh, REFRESH_COOKIE, setRefreshCookie, signAccess, verifyRefresh,
} from '../../services/token.service.js';

authenticator.options = { window: 1 };
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
// Compared against when the email is unknown so response time does not reveal valid accounts.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', env.BCRYPT_ROUNDS);

export const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  employee: u.employee || null,
  scope: u.scope,
  permissions: effectivePermissions(u),
  mustChangePassword: u.mustChangePassword,
  twoFactorEnabled: Boolean(u.twoFactor?.enabled),
  twoFactorSetupRequired: env.REQUIRE_2FA_SUPER_ADMIN && u.role === 'superAdmin' && !u.twoFactor?.enabled,
  lastLoginAt: u.lastLoginAt,
});

async function startSession(user, req, res) {
  const accessToken = signAccess(user);
  setRefreshCookie(res, await issueRefresh(user, req));
  return { accessToken, user: publicUser(user) };
}

async function registerFailure(user, req, why) {
  const fails = (user.failedLogins || 0) + 1;
  const update = { failedLogins: fails };
  if (fails >= MAX_FAILS) {
    update.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
    update.failedLogins = 0;
  }
  await User.updateOne({ _id: user._id }, { $set: update });
  await audit(req, { action: 'login_failed', module: 'auth', summary: why, actor: user });
}

export const login = asyncHandler(async (req, res) => {
  const { email, password, otp } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash +twoFactor.secretEnc');
  const generic = new ApiError(401, 'Invalid email or password', { code: 'BAD_CREDENTIALS' });

  if (!user || user.isDeleted || user.status !== 'active') {
    await bcrypt.compare(password, DUMMY_HASH);
    throw generic;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new ApiError(429, 'Too many failed attempts. Try again in a few minutes.', { code: 'LOCKED' });
  }
  if (!ok) {
    await registerFailure(user, req, 'Wrong password');
    throw generic;
  }

  if (user.twoFactor?.enabled) {
    if (!otp) return res.json({ twoFactorRequired: true });
    const valid = authenticator.check(otp, decrypt(user.twoFactor.secretEnc));
    if (!valid) {
      await registerFailure(user, req, 'Wrong 2FA code');
      throw new ApiError(401, 'Invalid authentication code', { code: 'BAD_OTP' });
    }
  }

  await User.updateOne({ _id: user._id }, { $set: { failedLogins: 0, lastLoginAt: new Date() }, $unset: { lockUntil: 1 } });
  user.lastLoginAt = new Date();
  await audit(req, { action: 'login', module: 'auth', summary: 'Signed in', actor: user });
  res.json(await startSession(user, req, res));
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new ApiError(401, 'No session', { code: 'NO_SESSION' });

  let payload;
  try {
    payload = verifyRefresh(token);
  } catch {
    clearRefreshCookie(res);
    throw new ApiError(401, 'Session expired', { code: 'NO_SESSION' });
  }
  const user = await User.findById(payload.sub);
  if (!user || user.isDeleted || user.status !== 'active') {
    clearRefreshCookie(res);
    throw new ApiError(401, 'Session expired', { code: 'NO_SESSION' });
  }

  // Atomic single-use: the hash must be present and is removed in the same operation.
  const hash = sha256(payload.jti);
  const consumed = await User.updateOne({ _id: user._id, refreshTokens: hash }, { $pull: { refreshTokens: hash } });
  if (!consumed.modifiedCount) {
    // A validly signed token that is no longer stored was already used: treat as theft and end every session.
    await User.updateOne({ _id: user._id }, { $set: { refreshTokens: [] } });
    await audit(req, { action: 'refresh_reuse_detected', module: 'auth', summary: 'Refresh token reuse - all sessions revoked', actor: user });
    clearRefreshCookie(res);
    throw new ApiError(401, 'Session expired', { code: 'NO_SESSION' });
  }
  res.json(await startSession(user, req, res));
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  try {
    const p = verifyRefresh(token);
    await User.updateOne({ _id: p.sub }, { $pull: { refreshTokens: sha256(p.jti) } });
  } catch { /* already invalid */ }
  clearRefreshCookie(res);
  res.json({ message: 'Signed out' });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $set: { refreshTokens: [] } });
  clearRefreshCookie(res);
  await audit(req, { action: 'logout_all', module: 'auth', summary: 'Signed out of all devices' });
  res.json({ message: 'Signed out everywhere' });
});

export const me = asyncHandler(async (req, res) => res.json({ user: publicUser(req.user) }));

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw new ApiError(400, 'Current password is incorrect');
  if (await bcrypt.compare(newPassword, user.passwordHash)) throw new ApiError(400, 'Choose a password you have not used before');
  if (newPassword.toLowerCase().includes(user.email.split('@')[0])) throw new ApiError(400, 'Password must not contain your email name');

  user.passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  user.passwordChangedAt = new Date();
  user.mustChangePassword = false;
  user.refreshTokens = [];
  await user.save();
  await audit(req, { action: 'password_changed', module: 'auth', summary: 'Password changed' });
  res.json(await startSession(user, req, res));
});

export const setup2fa = asyncHandler(async (req, res) => {
  if (req.user.twoFactor?.enabled) throw new ApiError(400, 'Two-factor authentication is already enabled');
  const secret = authenticator.generateSecret();
  await User.updateOne({ _id: req.user._id }, { $set: { 'twoFactor.pendingSecretEnc': encrypt(secret) } });
  const otpauth = authenticator.keyuri(req.user.email, 'Apparel ERP', secret);
  res.json({ secret, otpauth, qr: await QRCode.toDataURL(otpauth) });
});

export const enable2fa = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+twoFactor.pendingSecretEnc');
  if (!user.twoFactor?.pendingSecretEnc) throw new ApiError(400, 'Start the setup first');
  if (!authenticator.check(req.body.otp, decrypt(user.twoFactor.pendingSecretEnc))) throw new ApiError(400, 'That code is not valid');
  await User.updateOne(
    { _id: user._id },
    { $set: { 'twoFactor.enabled': true, 'twoFactor.secretEnc': user.twoFactor.pendingSecretEnc }, $unset: { 'twoFactor.pendingSecretEnc': 1 } },
  );
  await audit(req, { action: '2fa_enabled', module: 'auth', summary: 'Two-factor authentication enabled' });
  res.json({ message: 'Two-factor authentication enabled' });
});

export const disable2fa = asyncHandler(async (req, res) => {
  if (req.user.role === 'superAdmin' && env.REQUIRE_2FA_SUPER_ADMIN) throw new ApiError(403, 'Super Admins cannot disable 2FA');
  const user = await User.findById(req.user._id).select('+passwordHash +twoFactor.secretEnc');
  if (!user.twoFactor?.enabled) throw new ApiError(400, 'Two-factor authentication is not enabled');
  const okPw = await bcrypt.compare(req.body.password, user.passwordHash);
  const okOtp = authenticator.check(req.body.otp, decrypt(user.twoFactor.secretEnc));
  if (!okPw || !okOtp) throw new ApiError(400, 'Password or code is incorrect');
  await User.updateOne({ _id: user._id }, { $set: { 'twoFactor.enabled': false }, $unset: { 'twoFactor.secretEnc': 1 } });
  await audit(req, { action: '2fa_disabled', module: 'auth', summary: 'Two-factor authentication disabled' });
  res.json({ message: 'Two-factor authentication disabled' });
});
