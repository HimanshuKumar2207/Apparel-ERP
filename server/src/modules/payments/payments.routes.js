import { createCrud } from '../../utils/crud.js';
import { crudRoutes } from '../../utils/crudRoutes.js';
import { ApiError } from '../../utils/ApiError.js';
import { Payment } from '../../models/Payment.js';
import { Party } from '../../models/Party.js';
import { scopeFilter } from '../../services/scope.service.js';
import { paymentSchema, paymentUpdateSchema } from '../../validators/sales.validators.js';

async function assertParty(data, req) {
  if (!data.party) return;
  const scope = await scopeFilter(req.user, 'parties');
  const ok = await Party.exists({ $and: [{ _id: data.party, isDeleted: false }, scope] });
  if (!ok) throw new ApiError(403, 'Party not found or outside your scope');
}

const crud = createCrud({
  Model: Payment,
  module: 'payments',
  label: 'Payment',
  searchFields: ['referenceNo', 'note'],
  filterFields: ['party', 'mode'],
  populate: [{ path: 'party', select: 'name code city' }],
  defaultSort: '-date',
  beforeCreate: async (data, req) => { await assertParty(data, req); data.receivedBy = req.user._id; },
  beforeUpdate: assertParty,
});
export default crudRoutes({ crud, module: 'payments', createSchema: paymentSchema, updateSchema: paymentUpdateSchema });
