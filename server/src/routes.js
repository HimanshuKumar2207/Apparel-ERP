import { Router } from 'express';
import { authenticate } from './middleware/auth.js';
import authRoutes from './modules/auth/auth.routes.js';
import adminsRoutes from './modules/admins/admins.routes.js';
import employeesRoutes from './modules/employees/employees.routes.js';
import brandsRoutes from './modules/brands/brands.routes.js';
import subBrandsRoutes from './modules/brands/subBrands.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import partiesRoutes from './modules/parties/parties.routes.js';
import bookingsRoutes from './modules/bookings/bookings.routes.js';
import targetsRoutes from './modules/targets/targets.routes.js';
import invoicesRoutes from './modules/invoices/invoices.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import salaryRoutes from './modules/salary/salary.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

const router = Router();

router.get('/', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
router.use('/auth', authRoutes);

// Everything below requires a valid session
router.use(authenticate);
router.use('/dashboard', dashboardRoutes);
router.use('/admins', adminsRoutes);
router.use('/employees', employeesRoutes);
router.use('/brands', brandsRoutes);
router.use('/sub-brands', subBrandsRoutes);
router.use('/products', productsRoutes);
router.use('/parties', partiesRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/targets', targetsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/salary', salaryRoutes);
router.use('/reports', reportsRoutes);
router.use('/audit-logs', auditRoutes);

export default router;
