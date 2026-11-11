import { Router } from 'express';
import { authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createCrud, isId } from '../../utils/crud.js';
import { SalaryRecord } from '../../models/SalaryRecord.js';
import { audit } from '../../services/audit.service.js';
import { runPayroll } from '../../services/salary.service.js';
import { salaryRunSchema, salaryUpdateSchema } from '../../validators/hr.validators.js';

const crud = createCrud({
  Model: SalaryRecord,
  module: 'salary',
  label: 'Salary record',
  filterFields: ['employee', 'month', 'status'],
  populate: [{ path: 'employee', select: 'name code designation' }],
  defaultSort: '-month',
});

const r = Router();
r.param('id', (_q, _s, next, id) => (isId(id) ? next() : next(new ApiError(400, 'Invalid id'))));
r.get('/', authorize('salary', 'view'), crud.list);
r.get('/:id', authorize('salary', 'view'), crud.get);

r.post('/run', authorize('salary', 'add'), validate(salaryRunSchema), asyncHandler(async (req, res) => {
  const result = await runPayroll(req.body.month, req.user);
  await audit(req, { action: 'payroll_run', module: 'salary', summary: `Payroll run for ${req.body.month}: ${result.created} new, ${result.skipped} skipped` });
  res.json({ data: result });
}));

r.patch('/:id', authorize('salary', 'edit'), validate(salaryUpdateSchema), asyncHandler(async (req, res) => {
  const rec = await crud.findScoped(req, req.params.id);
  if (rec.status !== 'draft') throw new ApiError(409, 'Approved or paid salary is locked');
  const before = rec.toJSON();
  rec.set({ ...req.body, updatedBy: req.user._id });
  rec.recalc();
  await rec.save();
  await audit(req, { action: 'update', module: 'salary', recordId: rec._id, summary: 'Salary adjusted', before, after: rec.toJSON() });
  res.json({ data: await crud.present(rec, req) });
}));

r.post('/:id/approve', authorize('salary', 'approve'), asyncHandler(async (req, res) => {
  const rec = await crud.findScoped(req, req.params.id);
  if (rec.status !== 'draft') throw new ApiError(409, 'Only draft salary can be approved');
  rec.status = 'approved';
  rec.approvedBy = req.user._id;
  await rec.save();
  await audit(req, { action: 'approved', module: 'salary', recordId: rec._id, summary: `Salary ${rec.month} approved` });
  res.json({ data: await crud.present(rec, req) });
}));

r.post('/:id/pay', authorize('salary', 'approve'), asyncHandler(async (req, res) => {
  const rec = await crud.findScoped(req, req.params.id);
  if (rec.status !== 'approved') throw new ApiError(409, 'Approve the salary before marking it paid');
  rec.status = 'paid';
  rec.paidAt = new Date();
  await rec.save();
  await audit(req, { action: 'paid', module: 'salary', recordId: rec._id, summary: `Salary ${rec.month} marked paid` });
  res.json({ data: await crud.present(rec, req) });
}));

export default r;
