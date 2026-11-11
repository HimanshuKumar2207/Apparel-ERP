import { createCrud } from '../../utils/crud.js';
import { crudRoutes } from '../../utils/crudRoutes.js';
import { ApiError } from '../../utils/ApiError.js';
import { Party } from '../../models/Party.js';
import { nextCode } from '../../models/Counter.js';
import { outstandingByParty } from '../../services/outstanding.service.js';
import { partySchema, partyUpdateSchema } from '../../validators/sales.validators.js';

function assertRegion(user, region) {
  const regions = user.scope?.regions || [];
  if (user.role === 'admin' && regions.length && region && !regions.includes(region)) {
    throw new ApiError(403, 'This region is outside your assigned scope');
  }
}

const crud = createCrud({
  Model: Party,
  module: 'parties',
  label: 'Party',
  searchFields: ['name', 'code', 'city', 'gstNumber'],
  filterFields: ['region', 'city', 'status', 'assignedTo'],
  populate: [{ path: 'assignedTo', select: 'name code' }, { path: 'brands.brand', select: 'name' }],
  defaultSort: 'name',
  beforeCreate: async (data, req) => {
    assertRegion(req.user, data.region);
    if (!data.code) data.code = await nextCode('PTY-', 'party');
  },
  beforeUpdate: async (data, req) => assertRegion(req.user, data.region),
  decorate: async (items) => {
    const map = await outstandingByParty(items.map((i) => i._id));
    return items.map((i) => {
      const outstanding = map.get(String(i._id)) || 0;
      return { ...i, outstanding, creditUsedPct: i.creditLimit > 0 ? Math.round((outstanding / i.creditLimit) * 100) : null };
    });
  },
});
export default crudRoutes({ crud, module: 'parties', createSchema: partySchema, updateSchema: partyUpdateSchema });
