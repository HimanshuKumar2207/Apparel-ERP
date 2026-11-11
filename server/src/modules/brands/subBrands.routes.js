import { createCrud } from '../../utils/crud.js';
import { crudRoutes } from '../../utils/crudRoutes.js';
import { SubBrand } from '../../models/Brand.js';
import { subBrandSchema, subBrandUpdateSchema } from '../../validators/catalog.validators.js';

// Sub-brands share the 'brands' permission module and its scope.
const crud = createCrud({
  Model: SubBrand,
  module: 'brands',
  scopeKey: 'subBrands',
  label: 'Sub-brand',
  searchFields: ['name'],
  filterFields: ['brand', 'gender', 'status'],
  populate: [{ path: 'brand', select: 'name code' }],
  defaultSort: 'name',
});
export default crudRoutes({ crud, module: 'brands', createSchema: subBrandSchema, updateSchema: subBrandUpdateSchema });
