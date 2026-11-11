import { ACTIVE, remote } from './shared';

export const brandsConfig = {
  key: 'brands', module: 'brands', endpoint: '/brands', title: 'Brands', singular: 'Brand',
  subtitle: 'The brands you distribute. Discount limits here drive booking approvals.',
  searchPlaceholder: 'Search brand name or code...', defaultSort: 'name', modalSize: 'md',
  filters: [{ key: 'status', label: 'All statuses', options: ACTIVE }],
  columns: [
    { key: 'code', label: 'Code', type: 'mono', sortable: true },
    { key: 'name', label: 'Brand', sortable: true, render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: 'gstRate', label: 'GST', render: (r) => `${r.gstRate}%` },
    { key: 'defaultDiscount', label: 'Max discount', render: (r) => `${r.defaultDiscount}%` },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  fields: [
    { name: 'name', label: 'Brand name', required: true },
    { name: 'code', label: 'Short code', required: true, hint: 'e.g. URB (2-12 letters)' },
    { name: 'gstRate', label: 'GST rate (%)', type: 'number', min: 0, max: 40, defaultValue: 5 },
    { name: 'defaultDiscount', label: 'Max discount without approval (%)', type: 'number', min: 0, max: 100, defaultValue: 0 },
    { name: 'status', label: 'Status', type: 'select', options: ACTIVE, defaultValue: 'active', required: true },
  ],
};

export const subBrandsConfig = {
  key: 'sub-brands', module: 'brands', endpoint: '/sub-brands', title: 'Sub-brands', singular: 'Sub-brand',
  subtitle: "Each brand's lines, for example men's, women's or kids.",
  searchPlaceholder: 'Search sub-brands...', defaultSort: 'name', modalSize: 'md',
  invalidate: ['brands'],
  filters: [
    { key: 'brand', label: 'All brands', ...{ optionsFrom: remote('/brands') } },
    { key: 'gender', label: 'All lines', options: [{ value: 'men', label: 'Men' }, { value: 'women', label: 'Women' }, { value: 'kids', label: 'Kids' }, { value: 'unisex', label: 'Unisex' }] },
  ],
  columns: [
    { key: 'name', label: 'Sub-brand', sortable: true, render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: 'brand.name', label: 'Brand' },
    { key: 'gender', label: 'Line', type: 'badge' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  fields: [
    { name: 'brand', label: 'Brand', type: 'select', required: true, optionsFrom: remote('/brands') },
    { name: 'name', label: 'Sub-brand name', required: true },
    { name: 'gender', label: 'Line', type: 'select', required: true, defaultValue: 'unisex', options: [{ value: 'men', label: 'Men' }, { value: 'women', label: 'Women' }, { value: 'kids', label: 'Kids' }, { value: 'unisex', label: 'Unisex' }] },
    { name: 'status', label: 'Status', type: 'select', options: ACTIVE, defaultValue: 'active', required: true },
  ],
};
