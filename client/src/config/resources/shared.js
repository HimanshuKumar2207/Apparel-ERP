import { isoDay } from '../../lib/format';

export const ACTIVE = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];
export const today = () => isoDay();
export const remote = (endpoint, extra = {}) => ({ endpoint, labelKey: 'name', valueKey: '_id', ...extra });
export const named = (o) => o?.name || '-';
