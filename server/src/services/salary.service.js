import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { SalaryRecord } from '../models/SalaryRecord.js';
import { Target } from '../models/Target.js';
import { attachAchievement } from './achievement.service.js';
import { incentiveFor } from './incentive.service.js';

/**
 * Creates a DRAFT salary record for every active employee for `month` (YYYY-MM).
 * Existing records are never overwritten, so approved/paid months stay locked.
 * payable days = present + 0.5*halfDay + leave (paid). If no attendance exists, the full month is assumed.
 */
export async function runPayroll(month, user) {
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

  const employees = await Employee.find({ isDeleted: false, status: 'active' });
  const attendance = await Attendance.find({ isDeleted: false, date: { $regex: `^${month}-` } });
  const byEmp = new Map();
  for (const a of attendance) {
    const k = String(a.employee);
    byEmp.set(k, (byEmp.get(k) || 0) + ({ present: 1, halfDay: 0.5, leave: 1, absent: 0 }[a.status] ?? 0));
  }
  const existing = new Set((await SalaryRecord.find({ month, isDeleted: false }).select('employee')).map((s) => String(s.employee)));

  let created = 0;
  let skipped = 0;
  for (const e of employees) {
    if (existing.has(String(e._id))) { skipped++; continue; }
    const hasAttendance = attendance.some((a) => String(a.employee) === String(e._id));
    const payableDays = hasAttendance ? Math.min(byEmp.get(String(e._id)) || 0, daysInMonth) : daysInMonth;

    const targets = await Target.find({ employee: e._id, isDeleted: false, periodEnd: { $gte: start, $lte: end } }).lean();
    const withAch = await attachAchievement(targets);
    const incentive = withAch.reduce((s, t) => s + incentiveFor(t.achievedValue, t.percent), 0);

    const rec = new SalaryRecord({
      employee: e._id, month, daysInMonth, payableDays,
      basic: e.salary?.basic || 0, allowances: e.salary?.allowances || 0,
      deductions: e.salary?.deductions || 0, advances: 0, incentive,
      note: hasAttendance ? undefined : 'No attendance recorded: full month assumed',
      createdBy: user._id, updatedBy: user._id,
    });
    rec.recalc();
    await rec.save();
    created++;
  }
  return { month, created, skipped };
}
