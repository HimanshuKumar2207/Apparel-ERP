import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../app/AuthContext';
import { api, errorMessage } from '../../lib/api';
import { cn, debounce } from '../../lib/utils';
import DataTable from '../data/DataTable';
import Pagination from '../data/Pagination';
import DynamicForm from '../form/DynamicForm';
import { useOptions } from '../form/useOptions';
import Button from '../ui/Button';
import { Card } from '../ui/Card';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Select } from '../ui/Input';
import Modal from '../ui/Modal';
import { EmptyState, PageHeader } from '../ui/Misc';

function FilterSelect({ filter, value, onChange }) {
  const { options } = useOptions(filter, {});
  return <Select value={value || ''} onChange={(e) => onChange(e.target.value)} options={options} placeholder={filter.label} className="!h-10 !w-auto min-w-[9rem] !py-0" aria-label={filter.label} />;
}

function IconAction({ icon: Icon, label, onClick, tone }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick}
      className={cn('rounded-lg p-2 text-muted transition hover:bg-surface2 hover:text-ink', tone === 'danger' && 'hover:bg-danger/10 hover:text-danger', tone === 'success' && 'hover:bg-success/10 hover:text-success', tone === 'brand' && 'hover:bg-brand-soft hover:text-brand')}>
      <Icon className="h-4 w-4" />
    </button>
  );
}

/**
 * One generic, permission-aware CRUD screen driven entirely by a config object (see /config/resources).
 * Search, filters, sorting, pagination, create/edit form, delete, custom row actions and toolbar are all config.
 */
export default function ResourcePage({ config }) {
  const { user, can } = useAuth();
  const qc = useQueryClient();
  const [params, setParams] = useState({ page: 1, limit: config.pageSize || 15, q: '', sort: config.defaultSort || '', filters: {} });
  const [searchText, setSearchText] = useState('');
  const [form, setForm] = useState(null); // { mode, row }
  const [confirm, setConfirm] = useState(null);
  const [actionForm, setActionForm] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);

  const setQ = useMemo(() => debounce((q) => setParams((p) => ({ ...p, q, page: 1 })), 350), []);
  useEffect(() => { setQ(searchText); }, [searchText, setQ]);

  const query = useQuery({
    queryKey: [config.key, params],
    queryFn: async () => {
      const { page, limit, q, sort, filters } = params;
      const res = await api.get(config.endpoint, { params: { page, limit, q: q || undefined, sort: sort || undefined, ...filters } });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: [config.key] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['options'] });
    for (const k of config.invalidate || []) qc.invalidateQueries({ queryKey: [k] });
  };
  const ctx = { user, can, refresh };

  const canAdd = !config.noCreate && !config.readOnly && !config.hideCreate?.(user) && can(config.module, 'add');
  const canEdit = !config.readOnly && can(config.module, 'edit');
  const canDelete = !config.noDelete && !config.readOnly && can(config.module, 'delete');

  const save = async (payload) => {
    if (form.mode === 'edit') await api.patch(`${config.endpoint}/${form.row._id}`, payload);
    else await api.post(config.endpoint, payload);
    toast.success(form.mode === 'edit' ? `${config.singular} updated` : `${config.singular} created`);
    setForm(null);
    refresh();
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`${config.endpoint}/${confirm.row._id}`);
      toast.success(`${config.singular} deleted`);
      setConfirm(null);
      refresh();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  const runAction = async (action, row) => {
    if (action.form) { setActionForm({ action, row }); return; }
    if (action.confirm) { setConfirm({ action, row, message: action.confirm, label: action.label, danger: action.danger }); return; }
    await execute(action, row);
  };
  const execute = async (action, row) => {
    setBusy(true);
    try {
      await action.onClick(row, ctx);
      if (action.success) toast.success(action.success);
      setConfirm(null);
      refresh();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  const meta = query.data?.meta;
  const rows = query.data?.data || [];
  const rowActions = (config.rowActions || []).filter(Boolean);

  const renderActions = (row) => (
    <div className="flex items-center justify-end gap-0.5 opacity-70 transition group-hover:opacity-100">
      {config.detail && <IconAction icon={Eye} label={config.detailLabel || 'View details'} onClick={() => setDetail(row)} />}
      {rowActions.filter((a) => (!a.permission || can(config.module, a.permission)) && (!a.show || a.show(row, ctx))).map((a) => (
        <IconAction key={a.key} icon={a.icon} label={a.label} tone={a.tone || (a.danger ? 'danger' : 'brand')} onClick={() => runAction(a, row)} />
      ))}
      {canEdit && (!config.canEditRow || config.canEditRow(row, user)) && <IconAction icon={Pencil} label="Edit" onClick={() => setForm({ mode: 'edit', row })} />}
      {canDelete && (!config.canDeleteRow || config.canDeleteRow(row, user)) && <IconAction icon={Trash2} label="Delete" tone="danger" onClick={() => setConfirm({ row, message: `Delete this ${config.singular.toLowerCase()}? It will be hidden from lists but kept in the audit history.`, label: 'Delete', danger: true, remove: true })} />}
    </div>
  );
  const hasActions = config.detail || rowActions.length > 0 || canEdit || canDelete;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={<>
          {config.toolbar?.({ ...ctx })}
          {canAdd && <Button icon={Plus} onClick={() => setForm({ mode: 'create' })}>{config.addLabel || `New ${config.singular.toLowerCase()}`}</Button>}
        </>}
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3 sm:p-4">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder={config.searchPlaceholder || 'Search...'} className="input !h-10 !py-0 pl-10" aria-label="Search" />
          </div>
          {(config.filters || []).map((f) => (
            <FilterSelect key={f.key} filter={f} value={params.filters[f.key]}
              onChange={(v) => setParams((p) => ({ ...p, page: 1, filters: { ...p.filters, [f.key]: v || undefined } }))} />
          ))}
          <Button variant="ghost" size="icon" onClick={refresh} aria-label="Refresh" className="ml-auto"><RefreshCw className={cn('h-4 w-4', query.isFetching && 'animate-spin')} /></Button>
        </div>

        {query.isError ? (
          <EmptyState title="Could not load data" message={errorMessage(query.error)} action={<Button variant="secondary" onClick={() => query.refetch()}>Try again</Button>} />
        ) : (
          <DataTable
            columns={config.columns}
            rows={rows}
            loading={query.isLoading}
            sort={params.sort}
            onSort={(sort) => setParams((p) => ({ ...p, sort, page: 1 }))}
            renderActions={hasActions ? renderActions : undefined}
            empty={config.empty}
          />
        )}
        <Pagination meta={meta} onPage={(page) => setParams((p) => ({ ...p, page }))} onLimit={(limit) => setParams((p) => ({ ...p, limit, page: 1 }))} />
      </Card>

      <Modal open={Boolean(form)} onClose={() => setForm(null)} size={config.modalSize || 'lg'}
        title={form?.mode === 'edit' ? `Edit ${config.singular.toLowerCase()}` : `New ${config.singular.toLowerCase()}`} subtitle={config.formSubtitle}>
        {form && <DynamicForm fields={config.fields} initial={form.row} mode={form.mode} user={user} onSubmit={save} onCancel={() => setForm(null)} footer={config.formFooter} />}
      </Modal>

      <Modal open={Boolean(actionForm)} onClose={() => setActionForm(null)} size={actionForm?.action.form.size || 'sm'} title={actionForm?.action.form.title || actionForm?.action.label} subtitle={actionForm?.row && actionForm.action.form.subtitle?.(actionForm.row)}>
        {actionForm && (
          <DynamicForm fields={actionForm.action.form.fields} initial={actionForm.action.form.initial?.(actionForm.row)} user={user}
            submitLabel={actionForm.action.form.submitLabel || actionForm.action.label}
            onSubmit={async (payload) => {
              await actionForm.action.form.submit(actionForm.row, payload, ctx);
              toast.success(actionForm.action.success || 'Done');
              setActionForm(null);
              refresh();
            }}
            onCancel={() => setActionForm(null)} />
        )}
      </Modal>

      <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} title={confirm?.label} message={confirm?.message} confirmLabel={confirm?.label} danger={confirm?.danger} loading={busy}
        onConfirm={() => (confirm.remove ? remove() : execute(confirm.action, confirm.row))} />

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail && config.detailTitle ? config.detailTitle(detail) : 'Details'} size={config.detailSize || 'lg'}>
        {detail && config.renderDetail && config.renderDetail(detail, ctx)}
        {detail && !config.renderDetail && <pre className="scroll-thin max-h-[60vh] overflow-auto rounded-xl bg-surface2 p-4 text-xs leading-relaxed">{JSON.stringify(detail, null, 2)}</pre>}
      </Modal>
    </div>
  );
}
