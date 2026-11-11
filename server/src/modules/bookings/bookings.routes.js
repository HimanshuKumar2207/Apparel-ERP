import { Router } from 'express';
import { BOOKING_TRANSITIONS } from '../../config/permissions.js';
import { authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createCrud, isId } from '../../utils/crud.js';
import { crudRoutes } from '../../utils/crudRoutes.js';
import { Booking } from '../../models/Booking.js';
import { Brand } from '../../models/Brand.js';
import { Party } from '../../models/Party.js';
import { nextCode } from '../../models/Counter.js';
import { audit } from '../../services/audit.service.js';
import { can } from '../../services/permissions.service.js';
import { outstandingByParty } from '../../services/outstanding.service.js';
import { assignedBrandIds, scopeFilter } from '../../services/scope.service.js';
import { bookingApprovalSchema, bookingSchema, bookingStatusSchema, bookingUpdateSchema } from '../../validators/sales.validators.js';

/** Writers may only book for parties and brands inside their scope. */
async function assertBookingScope(user, { party, items }) {
  const partyScope = await scopeFilter(user, 'parties');
  const p = await Party.findOne({ $and: [{ _id: party, isDeleted: false, status: 'active' }, partyScope] });
  if (!p) throw new ApiError(403, 'Party not found, inactive, or outside your scope');
  const brandIds = [...new Set((items || []).map((i) => String(i.brand)))];
  if (user.role === 'admin' && user.scope?.brands?.length) {
    const allowed = user.scope.brands.map(String);
    if (brandIds.some((b) => !allowed.includes(b))) throw new ApiError(403, 'One or more brands are outside your scope');
  }
  if (user.role === 'salesperson') {
    const allowed = (await assignedBrandIds(user.employee)).map(String);
    if (brandIds.some((b) => !allowed.includes(b))) throw new ApiError(403, 'You can only book brands assigned to you');
  }
}

/** Discounts above the brand's default limit need an approver before confirmation. */
async function applyDiscountRule(data) {
  const ids = [...new Set(data.items.map((i) => String(i.brand)))];
  const brands = await Brand.find({ _id: { $in: ids } }).select('defaultDiscount');
  const limit = new Map(brands.map((b) => [String(b._id), b.defaultDiscount || 0]));
  const exceeds = data.items.some((i) => (i.discountPct || 0) > (limit.get(String(i.brand)) ?? 0));
  data.approvalStatus = exceeds ? 'pending' : 'none';
  data.approvalReason = exceeds ? 'Discount above brand limit' : undefined;
}

const crud = createCrud({
  Model: Booking,
  module: 'bookings',
  label: 'Booking',
  searchFields: ['bookingNo', 'notes'],
  filterFields: ['party', 'employee', 'status', 'approvalStatus', 'monthKey'],
  populate: [{ path: 'party', select: 'name code city region' }, { path: 'employee', select: 'name code' }, { path: 'items.brand', select: 'name' }, { path: 'items.subBrand', select: 'name' }, { path: 'invoice', select: 'invoiceNo total status' }],
  defaultSort: '-date',
  beforeCreate: async (data, req) => {
    const u = req.user;
    if (u.role === 'salesperson') data.employee = u.employee;
    if (!data.employee) throw new ApiError(422, 'Choose the employee who took this booking');
    await assertBookingScope(u, data);
    data.bookingNo = await nextCode(`BK-${new Date().getFullYear()}-`, `booking-${new Date().getFullYear()}`, 5);
    data.status = data.status === 'draft' ? 'draft' : 'booked';
    await applyDiscountRule(data);
  },
  beforeUpdate: async (data, req, doc) => {
    const u = req.user;
    if (doc.invoice) throw new ApiError(409, 'This booking is invoiced. Cancel the invoice before editing it.');
    if (!['draft', 'booked'].includes(doc.status) && u.role !== 'superAdmin') {
      throw new ApiError(409, 'Only draft or booked bookings can be edited');
    }
    if (u.role === 'salesperson') delete data.employee;
    const merged = { party: data.party ?? doc.party, items: data.items ?? doc.items };
    await assertBookingScope(u, merged);
    if (data.items) {
      await applyDiscountRule(data);
      // an edit after approval re-opens approval only if it still breaks the rule
      if (data.approvalStatus === 'none' && doc.approvalStatus === 'approved') data.approvalStatus = 'approved';
    }
  },
});

const r = Router();
const router = crudRoutes({
  crud,
  module: 'bookings',
  createSchema: bookingSchema,
  updateSchema: bookingUpdateSchema,
  before: (rr) => {
    rr.post('/:id/status', authorize('bookings', 'edit'), validate(bookingStatusSchema), asyncHandler(async (req, res) => {
      if (!isId(req.params.id)) throw new ApiError(400, 'Invalid id');
      const doc = await crud.findScoped(req, req.params.id);
      const next = req.body.status;
      if (doc.invoice && next === 'cancelled') throw new ApiError(409, 'Cancel the invoice first');
      if (!BOOKING_TRANSITIONS[doc.status].includes(next)) throw new ApiError(409, `Cannot move a ${doc.status} booking to ${next}`);

      const needsApprover = ['confirmed', 'dispatched', 'delivered'].includes(next) || (next === 'cancelled' && !['draft', 'booked'].includes(doc.status));
      if (needsApprover && !can(req.user, 'bookings', 'approve')) throw new ApiError(403, 'Only an approver can do this');

      if (next === 'confirmed') {
        if (doc.approvalStatus === 'pending') throw new ApiError(409, 'This booking needs approval first', { code: 'APPROVAL_REQUIRED' });
        if (doc.approvalStatus === 'rejected') throw new ApiError(409, 'Approval was rejected. Edit the booking and resubmit.', { code: 'APPROVAL_REJECTED' });
        const party = await Party.findById(doc.party).select('creditLimit');
        if (doc.approvalStatus !== 'approved' && party?.creditLimit > 0) {
          const out = (await outstandingByParty([doc.party])).get(String(doc.party)) || 0;
          if (out + doc.totalAmount > party.creditLimit) {
            doc.approvalStatus = 'pending';
            doc.approvalReason = 'Credit limit exceeded';
            await doc.save();
            await audit(req, { action: 'approval_requested', module: 'bookings', recordId: doc._id, summary: 'Credit limit exceeded - approval required' });
            throw new ApiError(409, 'Credit limit exceeded. An approver must approve this booking first.', { code: 'APPROVAL_REQUIRED' });
          }
        }
      }
      const before = doc.status;
      doc.status = next;
      doc.updatedBy = req.user._id;
      await doc.save();
      await audit(req, { action: 'status', module: 'bookings', recordId: doc._id, summary: `${doc.bookingNo}: ${before} -> ${next}` });
      res.json({ data: await crud.present(doc, req) });
    }));

    rr.post('/:id/approve', authorize('bookings', 'approve'), validate(bookingApprovalSchema), asyncHandler(async (req, res) => {
      if (!isId(req.params.id)) throw new ApiError(400, 'Invalid id');
      const doc = await crud.findScoped(req, req.params.id);
      if (doc.approvalStatus !== 'pending') throw new ApiError(409, 'Nothing is waiting for approval on this booking');
      doc.approvalStatus = req.body.decision;
      doc.approvalNote = req.body.note;
      doc.approvedBy = req.user._id;
      await doc.save();
      await audit(req, { action: req.body.decision === 'approved' ? 'approved' : 'rejected', module: 'bookings', recordId: doc._id, summary: `${doc.bookingNo} ${req.body.decision}: ${doc.approvalReason || ''}`, after: { note: req.body.note } });
      res.json({ data: await crud.present(doc, req) });
    }));
  },
});
r.use(router);
export default r;
