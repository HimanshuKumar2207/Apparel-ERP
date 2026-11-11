import { Router } from 'express';
import { authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as reports from '../../services/reports.service.js';
import { reportQuerySchema } from '../../validators/hr.validators.js';

const r = Router();
r.use(authorize('reports', 'view'), validate(reportQuerySchema, 'query'));

const handler = (fn) => asyncHandler(async (req, res) => res.json({ data: await fn(req.user, req.validatedQuery || {}) }));
r.get('/brand-sales', handler(reports.brandSales));
r.get('/party-sales', handler(reports.partySales));
r.get('/party-brand', handler(reports.partyBrand));
r.get('/employee-performance', handler(reports.employeePerformance));
r.get('/trend', handler(reports.monthlyTrend));
export default r;
