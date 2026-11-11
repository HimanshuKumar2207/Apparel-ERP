import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { env } from '../../config/env.js';
import { authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createCrud, isId } from '../../utils/crud.js';
import { User } from '../../models/User.js';
import { audit } from '../../services/audit.service.js';
import { createAdminSchema, resetPasswordSchema, updateAdminSchema } from '../../validators/admin.validators.js';

// Super Admins are created only through the CLI (npm run create-super-admin), never through the API.
const crud = createCrud({
  Model: User,
  module: 'admins',
  label: 'Admin',
  searchFields: ['name', 'email'],
  filterFields: ['role', 'status'],
  extraFilter: { role: { $in: ['admin', 'superAdmin'] } },
  populate: [{ path: 'scope.brands', select: 'name' }],
  defaultSort: 'role',
});

async function loadAdmin(id) {
  if (!isId(id)) throw new ApiError(400, 'Invalid id');
  const u = await User.findOne({ _id: id, role: 'admin', isDeleted: false });
  if (!u) throw new ApiError(404, 'Admin not found (Super Admins cannot be changed here)');
  return u;
}

const r = Router();
r.use(authorize('admins', 'view'));
r.get('/', crud.list);
r.get('/:id', crud.get);

r.post('/', authorize('admins', 'add'), validate(createAdminSchema), asyncHandler(async (req, res) => {
  const { name, email, password, permissions, scope } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'A user with this email already exists');
  const user = await User.create({
    name, email, role: 'admin', permissions, scope,
    passwordHash: await bcrypt.hash(password, env.BCRYPT_ROUNDS),
    mustChangePassword: true,
    createdBy: req.user._id,
  });
  await audit(req, { action: 'create', module: 'admins', recordId: user._id, summary: `Created admin ${email}`, after: { name, email, permissions, scope } });
  res.status(201).json({ data: user.toJSON() });
}));

r.patch('/:id', authorize('admins', 'edit'), validate(updateAdminSchema), asyncHandler(async (req, res) => {
  const user = await loadAdmin(req.params.id);
  const before = user.toJSON();
  user.set({ ...req.body, updatedBy: req.user._id });
  if (req.body.status === 'disabled') user.refreshTokens = [];
  await user.save();
  await audit(req, { action: 'update', module: 'admins', recordId: user._id, summary: `Updated admin ${user.email}`, before, after: user.toJSON() });
  res.json({ data: user.toJSON() });
}));

r.post('/:id/reset-password', authorize('admins', 'edit'), validate(resetPasswordSchema), asyncHandler(async (req, res) => {
  const user = await loadAdmin(req.params.id);
  user.passwordHash = await bcrypt.hash(req.body.password, env.BCRYPT_ROUNDS);
  user.passwordChangedAt = new Date();
  user.mustChangePassword = true;
  user.refreshTokens = [];
  user.failedLogins = 0;
  user.lockUntil = undefined;
  await user.save();
  await audit(req, { action: 'password_reset', module: 'admins', recordId: user._id, summary: `Reset password for ${user.email}` });
  res.json({ message: 'Password reset. The admin must change it at next sign-in.' });
}));

r.delete('/:id', authorize('admins', 'delete'), asyncHandler(async (req, res) => {
  const user = await loadAdmin(req.params.id);
  user.isDeleted = true;
  user.status = 'disabled';
  user.refreshTokens = [];
  await user.save();
  await audit(req, { action: 'delete', module: 'admins', recordId: user._id, summary: `Removed admin ${user.email}` });
  res.json({ message: 'Admin removed' });
}));

export default r;
