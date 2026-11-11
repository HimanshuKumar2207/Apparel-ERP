import { MODULES, ACTIONS, SALESPERSON_RULES } from '../config/permissions.js';

/** Can this user perform `action` on `module`? Server-side source of truth. */
export function can(user, module, action) {
  if (!user) return false;
  if (user.role === 'superAdmin') return true;
  if (user.role === 'admin') return Boolean(user.permissions?.[module]?.includes(action));
  return Boolean(SALESPERSON_RULES[module]?.includes(action));
}

/** Full module -> actions map, sent to the UI so it can hide what the user cannot do. */
export function effectivePermissions(user) {
  const out = {};
  for (const m of MODULES) out[m] = ACTIONS.filter((a) => can(user, m, a));
  return out;
}
