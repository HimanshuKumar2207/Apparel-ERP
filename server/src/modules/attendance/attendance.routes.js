import { authorize } from '../../middleware/auth.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createCrud } from '../../utils/crud.js';
import { crudRoutes } from '../../utils/crudRoutes.js';
import { Attendance } from '../../models/Attendance.js';
import { attendanceSchema, attendanceUpdateSchema } from '../../validators/hr.validators.js';

const today = () => new Date().toISOString().slice(0, 10);

const crud = createCrud({
  Model: Attendance,
  module: 'attendance',
  label: 'Attendance',
  filterFields: ['employee', 'status', 'date'],
  populate: [{ path: 'employee', select: 'name code' }],
  defaultSort: '-date',
  beforeCreate: async (_data, req) => {
    // Salespeople mark their own attendance through /check-in only
    if (req.user.role === 'salesperson') throw new ApiError(403, 'Use check-in to mark your attendance');
  },
});

export default crudRoutes({
  crud,
  module: 'attendance',
  createSchema: attendanceSchema,
  updateSchema: attendanceUpdateSchema,
  before: (r) => {
    // Salesperson self check-in / check-out
    r.post('/check-in', authorize('attendance', 'add'), asyncHandler(async (req, res) => {
      if (!req.user.employee) throw new ApiError(400, 'Your login is not linked to an employee');
      const date = today();
      const existing = await Attendance.findOne({ employee: req.user.employee, date });
      if (existing?.checkIn) throw new ApiError(409, 'Already checked in today');
      const rec = existing || new Attendance({ employee: req.user.employee, date, createdBy: req.user._id });
      rec.status = 'present';
      rec.checkIn = new Date();
      await rec.save();
      res.status(201).json({ data: rec.toJSON() });
    }));
    r.post('/check-out', authorize('attendance', 'add'), asyncHandler(async (req, res) => {
      const rec = await Attendance.findOne({ employee: req.user.employee, date: today() });
      if (!rec?.checkIn) throw new ApiError(409, 'You have not checked in today');
      if (rec.checkOut) throw new ApiError(409, 'Already checked out today');
      rec.checkOut = new Date();
      await rec.save();
      res.json({ data: rec.toJSON() });
    }));
  },
});
