import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authorize } from '../../middleware/auth.js';
import { Booking } from '../../models/Booking.js';
import { Employee } from '../../models/Employee.js';
import { Party } from '../../models/Party.js';
import { Target } from '../../models/Target.js';
import { can } from '../../services/permissions.service.js';
import { attachAchievement } from '../../services/achievement.service.js';
import { outstandingByParty } from '../../services/outstanding.service.js';
import { scopeFilter } from '../../services/scope.service.js';
import * as reports from '../../services/reports.service.js';

const r = Router();

r.get('/', authorize('reports', 'view'), asyncHandler(async (req, res) => {
  const u = req.user;
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const prevStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const prevEnd = new Date(monthStart.getTime() - 1);
  const sixAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const range = { from: monthStart, to: now };

  const bookingScope = await scopeFilter(u, 'bookings');
  const partyScope = await scopeFilter(u, 'parties');

  const [brands, parties, trend, prevBrands, leaderboard, monthBookings, pendingApprovals, partyIds, targets] = await Promise.all([
    reports.brandSales(u, range),
    reports.partySales(u, range, 5),
    reports.monthlyTrend(u, { from: sixAgo, to: now }),
    reports.brandSales(u, { from: prevStart, to: prevEnd }),
    u.role === 'salesperson' ? [] : reports.employeePerformance(u, range),
    Booking.countDocuments({ ...bookingScope, isDeleted: false, status: { $ne: 'cancelled' }, date: { $gte: monthStart } }),
    can(u, 'bookings', 'approve') ? Booking.countDocuments({ ...bookingScope, isDeleted: false, approvalStatus: 'pending' }) : 0,
    Party.find({ ...partyScope, isDeleted: false }).distinct('_id'),
    Target.find({ ...(await scopeFilter(u, 'targets')), isDeleted: false, periodStart: { $lte: now }, periodEnd: { $gte: monthStart } }).populate('employee', 'name').populate('brand', 'name').limit(8).lean(),
  ]);

  const sum = (rows) => rows.reduce((s, x) => s + x.value, 0);
  const outstandingMap = await outstandingByParty(partyIds);
  const outstanding = [...outstandingMap.values()].reduce((s, v) => s + Math.max(v, 0), 0);

  res.json({
    data: {
      role: u.role,
      kpis: {
        salesThisMonth: sum(brands),
        salesLastMonth: sum(prevBrands),
        bookingsThisMonth: monthBookings,
        pendingApprovals,
        outstanding,
        activeParties: partyIds.length,
        activeEmployees: can(u, 'employees', 'view') && u.role !== 'salesperson' ? await Employee.countDocuments({ isDeleted: false, status: 'active' }) : null,
      },
      brands,
      parties,
      trend,
      leaderboard: leaderboard.slice(0, 6),
      targets: await attachAchievement(targets),
    },
  });
}));

export default r;
