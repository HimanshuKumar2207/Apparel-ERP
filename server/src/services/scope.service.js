import { Party } from '../models/Party.js';
import { Employee } from '../models/Employee.js';

const partyIdsInRegions = (regions) => Party.find({ isDeleted: false, region: { $in: regions } }).distinct('_id');

/** Brand ids a salesperson is assigned to. */
export async function assignedBrandIds(employeeId) {
  if (!employeeId) return [];
  const e = await Employee.findById(employeeId).select('brands');
  return (e?.brands || []).map((b) => b.brand).filter(Boolean);
}

/**
 * Mongo filter that limits what `user` may see in `module`.
 *  - superAdmin: everything
 *  - admin: restricted by user.scope (brands / regions) when set
 *  - salesperson: only own records
 */
export async function scopeFilter(user, module) {
  if (user.role === 'superAdmin') return {};

  if (user.role === 'admin') {
    const brands = user.scope?.brands || [];
    const regions = user.scope?.regions || [];
    switch (module) {
      case 'brands': return brands.length ? { _id: { $in: brands } } : {};
      case 'subBrands':
      case 'products':
      case 'targets': return brands.length ? { brand: { $in: brands } } : {};
      case 'parties': return regions.length ? { region: { $in: regions } } : {};
      case 'payments': return regions.length ? { party: { $in: await partyIdsInRegions(regions) } } : {};
      case 'bookings':
      case 'invoices': {
        const f = {};
        if (brands.length) f.brands = { $in: brands };
        if (regions.length) f.party = { $in: await partyIdsInRegions(regions) };
        return f;
      }
      default: return {};
    }
  }

  // salesperson
  const emp = user.employee;
  if (!emp) return { _id: null };
  switch (module) {
    case 'employees': return { _id: emp };
    case 'parties': return { assignedTo: emp };
    case 'bookings':
    case 'invoices':
    case 'targets':
    case 'salary':
    case 'attendance': return { employee: emp };
    case 'payments': return { party: { $in: await Party.find({ assignedTo: emp, isDeleted: false }).distinct('_id') } };
    case 'brands': return { _id: { $in: await assignedBrandIds(emp) } };
    case 'subBrands':
    case 'products': return { brand: { $in: await assignedBrandIds(emp) } };
    default: return { _id: null };
  }
}
