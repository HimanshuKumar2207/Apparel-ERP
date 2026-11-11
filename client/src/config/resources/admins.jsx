import { KeyRound } from 'lucide-react';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { remote } from './shared';

const STRONG = '10+ characters with upper, lower, number and symbol';

export const adminsConfig = {
  key: 'admins', module: 'admins', endpoint: '/admins', title: 'Admins', singular: 'Admin', addLabel: 'New admin',
  subtitle: 'Create admins and decide exactly what each one can do and see. Super Admins are managed from the server.',
  searchPlaceholder: 'Search name or email...', defaultSort: 'role', modalSize: 'xl',
  canEditRow: (r) => r.role === 'admin',
  canDeleteRow: (r) => r.role === 'admin',
  filters: [{ key: 'role', label: 'All roles', options: [{ value: 'superAdmin', label: 'Super Admin' }, { value: 'admin', label: 'Admin' }] }],
  columns: [
    { key: 'name', label: 'Name', render: (r) => <div><p className="font-medium text-ink">{r.name}</p><p className="text-xs text-muted">{r.email}</p></div> },
    { key: 'role', label: 'Role', type: 'badge' },
    {
      key: 'permissions', label: 'Access',
      render: (r) => (r.role === 'superAdmin' ? <Badge tone="brand">Full access</Badge> : <span className="text-xs text-muted">{Object.keys(r.permissions || {}).length} modules</span>),
    },
    {
      key: 'scope', label: 'Scope',
      render: (r) => {
        if (r.role === 'superAdmin') return <span className="text-xs text-muted">Everything</span>;
        const b = r.scope?.brands?.length; const g = r.scope?.regions?.length;
        return b || g ? <span className="text-xs text-muted">{b ? `${b} brand${b > 1 ? 's' : ''}` : ''}{b && g ? ' - ' : ''}{g ? `${g} region${g > 1 ? 's' : ''}` : ''}</span> : <span className="text-xs text-muted">All data</span>;
      },
    },
    { key: 'twoFactor.enabled', label: '2FA', type: 'bool' },
    { key: 'lastLoginAt', label: 'Last sign-in', type: 'datetime' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  rowActions: [
    {
      key: 'reset', label: 'Reset password', icon: KeyRound, permission: 'edit', show: (r) => r.role === 'admin', success: 'Password reset',
      form: {
        title: 'Reset password', subtitle: (r) => `${r.name} must choose a new password at next sign-in.`, submitLabel: 'Reset password',
        fields: [{ name: 'password', label: 'Temporary password', type: 'password', required: true, hint: STRONG, autoComplete: 'new-password' }],
        submit: (r, payload) => api.post(`/admins/${r._id}/reset-password`, payload),
      },
    },
  ],
  fields: [
    { type: 'section', title: 'Account' },
    { name: 'name', label: 'Full name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true, createOnly: true },
    { name: 'password', label: 'Temporary password', type: 'password', required: true, createOnly: true, hint: STRONG, autoComplete: 'new-password' },
    { name: 'status', label: 'Status', type: 'select', editOnly: true, options: [{ value: 'active', label: 'Active' }, { value: 'disabled', label: 'Disabled (cannot sign in)' }] },
    { type: 'section', title: 'What this admin can do', subtitle: 'Permissions apply on the server, not just in the screens.' },
    { name: 'permissions', label: 'Permissions', type: 'permissions' },
    { type: 'section', title: 'Data scope (optional)', subtitle: 'Leave both empty to allow all brands and regions.' },
    { name: 'scope.brands', label: 'Limit to brands', type: 'multiselect', optionsFrom: remote('/brands') },
    { name: 'scope.regions', label: 'Limit to regions', type: 'tags', placeholder: 'Type a region and press Enter' },
  ],
};
