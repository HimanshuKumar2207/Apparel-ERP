import { createCrud } from '../../utils/crud.js';
import { crudRoutes } from '../../utils/crudRoutes.js';
import { Brand } from '../../models/Brand.js';
import { brandSchema, brandUpdateSchema } from '../../validators/catalog.validators.js';

const crud = createCrud({
  Model: Brand,
  module: 'brands',
  label: 'Brand',
  searchFields: ['name', 'code'],
  filterFields: ['status'],
  defaultSort: 'name',
});
export default crudRoutes({ crud, module: 'brands', createSchema: brandSchema, updateSchema: brandUpdateSchema });
