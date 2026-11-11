import { ACTIVE, remote } from './shared';

export const productsConfig = {
  key: 'products', module: 'products', endpoint: '/products', title: 'Products', singular: 'Product',
  subtitle: 'Styles with size-color stock.',
  searchPlaceholder: 'Search style code, name or season...', defaultSort: 'styleCode', modalSize: 'xl',
  filters: [
    { key: 'brand', label: 'All brands', optionsFrom: remote('/brands') },
    { key: 'status', label: 'All statuses', options: ACTIVE },
  ],
  columns: [
    { key: 'styleCode', label: 'Style', type: 'mono', sortable: true },
    { key: 'name', label: 'Product', sortable: true, render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: 'brand.name', label: 'Brand' },
    { key: 'subBrand.name', label: 'Sub-brand' },
    { key: 'season', label: 'Season' },
    { key: 'dealerPrice', label: 'Dealer price', type: 'money', align: 'right' },
    { key: 'mrp', label: 'MRP', type: 'money', align: 'right' },
    { key: 'totalStock', label: 'Stock', type: 'number', align: 'right' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  fields: [
    { type: 'section', title: 'Style details' },
    { name: 'subBrand', label: 'Brand / sub-brand', type: 'select', required: true, optionsFrom: remote('/sub-brands', { labelFn: (d) => `${d.brand?.name || ''} - ${d.name}` }) },
    { name: 'styleCode', label: 'Style code', required: true },
    { name: 'name', label: 'Product name', required: true },
    { name: 'season', label: 'Season', placeholder: 'e.g. Autumn/Winter 2026' },
    { name: 'sizes', label: 'Sizes', type: 'tags', placeholder: 'S, M, L...' },
    { name: 'colors', label: 'Colors', type: 'tags', placeholder: 'Black, Navy...' },
    { type: 'section', title: 'Pricing' },
    { name: 'dealerPrice', label: 'Dealer price', type: 'money' },
    { name: 'mrp', label: 'MRP', type: 'money' },
    { type: 'section', title: 'Stock (size / color)' },
    {
      name: 'stock', label: 'Stock lines', type: 'array', addLabel: 'Add stock line', emptyText: 'No stock recorded.',
      itemFields: [
        { name: 'size', label: 'Size' },
        { name: 'color', label: 'Color' },
        { name: 'qty', label: 'Quantity', type: 'number', min: 0 },
      ],
    },
    { name: 'status', label: 'Status', type: 'select', options: ACTIVE, defaultValue: 'active', required: true },
  ],
};
