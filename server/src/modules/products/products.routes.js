import { createCrud } from '../../utils/crud.js';
import { crudRoutes } from '../../utils/crudRoutes.js';
import { ApiError } from '../../utils/ApiError.js';
import { Product } from '../../models/Product.js';
import { SubBrand } from '../../models/Brand.js';
import { productSchema, productUpdateSchema } from '../../validators/catalog.validators.js';

async function attachBrand(data) {
  if (!data.subBrand) return;
  const sb = await SubBrand.findOne({ _id: data.subBrand, isDeleted: false });
  if (!sb) throw new ApiError(422, 'Sub-brand not found');
  data.brand = sb.brand;
}

const crud = createCrud({
  Model: Product,
  module: 'products',
  label: 'Product',
  searchFields: ['name', 'styleCode', 'season'],
  filterFields: ['brand', 'subBrand', 'season', 'status'],
  populate: [{ path: 'brand', select: 'name' }, { path: 'subBrand', select: 'name gender' }],
  defaultSort: 'styleCode',
  beforeCreate: attachBrand,
  beforeUpdate: attachBrand,
});
export default crudRoutes({ crud, module: 'products', createSchema: productSchema, updateSchema: productUpdateSchema });
