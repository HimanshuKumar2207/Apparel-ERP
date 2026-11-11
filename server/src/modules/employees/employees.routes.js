import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createCrud, isId } from '../../utils/crud.js';
import { crudRoutes } from '../../utils/crudRoutes.js';
import { encrypt } from '../../utils/crypto.js';
import { Employee } from '../../models/Employee.js';
import { User } from '../../models/User.js';
import { nextCode } from '../../models/Counter.js';
import { audit } from '../../services/audit.service.js';
import { employeeLoginSchema } from '../../validators/admin.validators.js';
import { employeeSchema, employeeUpdateSchema } from '../../validators/employee.validators.js';

/** Moves a plain account number into encrypted storage; the number itself is never persisted. */
function protectBank(data) {
  if (data.bank?.accountNumber) {
    data.bank.accountEnc = encrypt(data.bank.accountNumber);
    data.bank.last4 = data.bank.accountNumber.slice(-4);
  }
  if (data.bank) delete data.bank.accountNumber;
}

const crud = createCrud({
  Model: Employee,
  module: 'employees',
  label: 'Employee',
  searchFields: ['name', 'code', 'phone', 'designation'],
  filterFields: ['status', 'designation'],
  populate: [
    { path: 'reportingTo', select: 'name code' },
    { path: 'brands.brand', select: 'name' },
    { path: 'brands.subBrand', select: 'name' },
  ],
  defaultSort: 'name',
  mergeKeys: ['salary', 'bank'],
  beforeCreate: async (data) => {
    if (!data.code) data.code = await nextCode('EMP-', 'employee');
    protectBank(data);
  },
  beforeUpdate: async (data) => protectBank(data),
  decorate: async (items) => {
    const users = await User.find({ employee: { $in: items.map((i) => i._id) }, isDeleted: false }).select('employee email status');
    const byEmp = new Map(users.map((u) => [String(u.employee), u]));
    return items.map((i) => ({ ...i, loginEmail: byEmp.get(String(i._id))?.email || null, loginStatus: byEmp.get(String(i._id))?.status || null }));
  },
  afterSave: async (doc) => {
    if (doc.status === 'inactive') await User.updateMany({ employee: doc._id }, { $set: { status: 'disabled', refreshTokens: [] } });
  },
  afterRemove: async (doc) => User.updateMany({ employee: doc._id }, { $set: { status: 'disabled', refreshTokens: [] } }),
});

export default crudRoutes({
  crud,
  module: 'employees',
  createSchema: employeeSchema,
  updateSchema: employeeUpdateSchema,
  before: (r) => {
    // Create or reset the salesperson login for an employee
    r.post('/:id/login', authorize('employees', 'edit'), validate(employeeLoginSchema), asyncHandler(async (req, res) => {
      if (!isId(req.params.id)) throw new ApiError(400, 'Invalid id');
      const emp = await crud.findScoped(req, req.params.id);
      const { email, password } = req.body;
      const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
      let user = await User.findOne({ employee: emp._id, isDeleted: false });
      if (user) {
        user.set({ email, passwordHash, status: 'active', mustChangePassword: true, passwordChangedAt: new Date(), refreshTokens: [], failedLogins: 0 });
        user.lockUntil = undefined;
      } else {
        if (await User.exists({ email })) throw new ApiError(409, 'A user with this email already exists');
        user = new User({ name: emp.name, email, role: 'salesperson', employee: emp._id, passwordHash, mustChangePassword: true, createdBy: req.user._id });
      }
      await user.save();
      await audit(req, { action: 'login_created', module: 'employees', recordId: emp._id, summary: `Login set for ${emp.name} (${email})` });
      res.json({ message: 'Login saved. The employee must change the password at first sign-in.' });
    }));
  },
});
