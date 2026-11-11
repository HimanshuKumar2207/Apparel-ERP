import { authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createCrud, isId } from '../../utils/crud.js';
import { crudRoutes } from '../../utils/crudRoutes.js';
import { Booking } from '../../models/Booking.js';
import { Invoice } from '../../models/Invoice.js';
import { audit } from '../../services/audit.service.js';
import { cancelInvoice, issueInvoice } from '../../services/invoice.service.js';
import { scopeFilter } from '../../services/scope.service.js';
import { invoiceCancelSchema, invoiceCreateSchema } from '../../validators/sales.validators.js';

const crud = createCrud({
  Model: Invoice,
  module: 'invoices',
  label: 'Invoice',
  searchFields: ['invoiceNo', 'buyer.name', 'buyer.gstin'],
  filterFields: ['party', 'employee', 'status'],
  populate: [
    { path: 'party', select: 'name code city' },
    { path: 'employee', select: 'name code' },
    { path: 'items.brand', select: 'name' },
  ],
  defaultSort: '-date',
});

export default crudRoutes({
  crud,
  module: 'invoices',
  readOnly: true,
  before: (r) => {
    // Flat rows for the accountant (CSV / Tally prep): GET /invoices/export?month=2026-10
    r.get('/export', authorize('invoices', 'view'), asyncHandler(async (req, res) => {
      const month = String(req.query.month || '');
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new ApiError(422, 'month must be YYYY-MM');
      const [y, m] = month.split('-').map(Number);
      const scope = await scopeFilter(req.user, 'invoices');
      const docs = await Invoice.find({
        $and: [{ isDeleted: false, date: { $gte: new Date(Date.UTC(y, m - 1, 1)), $lt: new Date(Date.UTC(y, m, 1)) } }, scope],
      }).sort('date').limit(5000);
      await audit(req, { action: 'export', module: 'invoices', summary: `Exported ${docs.length} invoices for ${month}` });
      res.json({ data: docs.map((d) => d.toJSON()) });
    }));

    r.post('/', authorize('invoices', 'add'), validate(invoiceCreateSchema), asyncHandler(async (req, res) => {
      const scope = await scopeFilter(req.user, 'bookings');
      const booking = await Booking.findOne({ $and: [{ _id: req.body.booking, isDeleted: false }, scope] });
      if (!booking) throw new ApiError(404, 'Booking not found');
      const invoice = await issueInvoice(booking, req.user);
      await audit(req, { action: 'create', module: 'invoices', recordId: invoice._id, summary: `Issued ${invoice.invoiceNo} for ${booking.bookingNo}`, after: { total: invoice.total } });
      res.status(201).json({ data: await crud.present(invoice, req) });
    }));

    r.post('/:id/cancel', authorize('invoices', 'approve'), validate(invoiceCancelSchema), asyncHandler(async (req, res) => {
      if (!isId(req.params.id)) throw new ApiError(400, 'Invalid id');
      const invoice = await crud.findScoped(req, req.params.id);
      if (invoice.status !== 'issued') throw new ApiError(409, 'Invoice is already cancelled');
      const booking = await Booking.findById(invoice.booking);
      await cancelInvoice(invoice, booking, req.user, req.body.reason);
      await audit(req, { action: 'cancel', module: 'invoices', recordId: invoice._id, summary: `Cancelled ${invoice.invoiceNo}: ${req.body.reason}` });
      res.json({ data: await crud.present(invoice, req) });
    }));
  },
});
