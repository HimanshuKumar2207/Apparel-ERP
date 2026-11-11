import { createCrud } from '../../utils/crud.js';
import { crudRoutes } from '../../utils/crudRoutes.js';
import { ApiError } from '../../utils/ApiError.js';
import { Target } from '../../models/Target.js';
import { attachAchievement } from '../../services/achievement.service.js';
import { incentiveFor } from '../../services/incentive.service.js';
import { targetSchema, targetUpdateSchema } from '../../validators/sales.validators.js';

function assertBrand(data, req) {
  const brands = req.user.scope?.brands || [];
  if (req.user.role === 'admin' && brands.length && data.brand && !brands.map(String).includes(String(data.brand))) {
    throw new ApiError(403, 'This brand is outside your assigned scope');
  }
}

const crud = createCrud({
  Model: Target,
  module: 'targets',
  label: 'Target',
  filterFields: ['employee', 'brand', 'subBrand', 'periodType'],
  populate: [
    { path: 'employee', select: 'name code' },
    { path: 'brand', select: 'name' },
    { path: 'subBrand', select: 'name' },
  ],
  defaultSort: '-periodStart',
  beforeCreate: async (data, req) => assertBrand(data, req),
  beforeUpdate: async (data, req) => assertBrand(data, req),
  decorate: async (items) => (await attachAchievement(items)).map((t) => ({ ...t, incentive: incentiveFor(t.achievedValue, t.percent) })),
});
export default crudRoutes({ crud, module: 'targets', createSchema: targetSchema, updateSchema: targetUpdateSchema });
