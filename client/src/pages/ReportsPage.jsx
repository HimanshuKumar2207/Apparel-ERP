import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../app/ThemeContext';
import DataTable from '../components/data/DataTable';
import Button from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { PageHeader, Skeleton, Tabs } from '../components/ui/Misc';
import { api, errorMessage } from '../lib/api';
import { isoDay, money, moneyCompact, monthLabel, number } from '../lib/format';
import { downloadCsv } from '../lib/utils';

const TABS = [
  { key: 'brand-sales', label: 'Brand-wise' },
  { key: 'party-sales', label: 'Party-wise' },
  { key: 'party-brand', label: 'Party x Brand' },
  { key: 'employee-performance', label: 'Employees' },
  { key: 'trend', label: 'Monthly trend' },
];

const startOfMonth = () => `${isoDay().slice(0, 8)}01`;
const daysBack = (n) => isoDay(new Date(Date.now() - n * 864e5));
const PRESETS = [
  { key: 'month', label: 'This month', range: () => ({ from: startOfMonth(), to: isoDay() }) },
  { key: '30', label: 'Last 30 days', range: () => ({ from: daysBack(30), to: isoDay() }) },
  { key: '90', label: 'Last 90 days', range: () => ({ from: daysBack(90), to: isoDay() }) },
  { key: 'year', label: 'This year', range: () => ({ from: `${isoDay().slice(0, 4)}-01-01`, to: isoDay() }) },
];
const COLORS = ['#4f46e5', '#0d9488', '#f59e0b', '#ec4899', '#0ea5e9', '#84cc16', '#8b5cf6', '#ef4444'];

function Tip({ active, payload, label, fmt = money }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-medium text-ink">{label}</p>
      {payload.map((p) => <p key={p.dataKey} className="tabular-nums text-muted">{p.name}: {fmt(p.value)}</p>)}
    </div>
  );
}

export default function ReportsPage() {
  const { dark } = useTheme();
  const grid = dark ? '#282f42' : '#e3e7f1';
  const text = dark ? '#96a0b6' : '#647085';
  const [tab, setTab] = useState('brand-sales');
  const [preset, setPreset] = useState('month');
  const [range, setRange] = useState(PRESETS[0].range());

  const q = useQuery({
    queryKey: ['reports', tab, range],
    queryFn: async () => (await api.get(`/reports/${tab}`, { params: range })).data.data,
  });
  const rows = q.data || [];
  const total = useMemo(() => rows.reduce((s, r) => s + (r.value || 0), 0), [rows]);

  // Party x Brand pivot: one row per party, one column per brand
  const pivot = useMemo(() => {
    if (tab !== 'party-brand') return null;
    const brands = [...new Set(rows.map((r) => r.brand))].sort();
    const byParty = new Map();
    for (const r of rows) {
      const p = byParty.get(r.party) || { party: r.party, city: r.city, total: 0 };
      p[r.brand] = (p[r.brand] || 0) + r.value;
      p.total += r.value;
      byParty.set(r.party, p);
    }
    return { brands, rows: [...byParty.values()].sort((a, b) => b.total - a.total) };
  }, [rows, tab]);

  const share = (v) => (total ? `${Math.round((v / total) * 1000) / 10}%` : '-');
  const cols = {
    'brand-sales': [
      { key: 'brand', label: 'Brand', render: (r) => <span className="font-medium text-ink">{r.brand}</span> },
      { key: 'bookings', label: 'Bookings', type: 'number', align: 'right' },
      { key: 'qty', label: 'Pieces', type: 'number', align: 'right' },
      { key: 'value', label: 'Sales', type: 'money', align: 'right' },
      { key: 'share', label: 'Share', align: 'right', render: (r) => share(r.value), value: (r) => share(r.value) },
    ],
    'party-sales': [
      { key: 'party', label: 'Party', render: (r) => <div><p className="font-medium text-ink">{r.party}</p><p className="text-xs text-muted">{[r.city, r.region].filter(Boolean).join(' - ')}</p></div>, value: (r) => r.party },
      { key: 'bookings', label: 'Bookings', type: 'number', align: 'right' },
      { key: 'qty', label: 'Pieces', type: 'number', align: 'right' },
      { key: 'value', label: 'Sales', type: 'money', align: 'right' },
      { key: 'share', label: 'Share', align: 'right', render: (r) => share(r.value), value: (r) => share(r.value) },
    ],
    'employee-performance': [
      { key: 'employee', label: 'Employee', render: (r) => <span className="font-medium text-ink">{r.employee}</span> },
      { key: 'qty', label: 'Pieces', type: 'number', align: 'right' },
      { key: 'target', label: 'Target', type: 'money', align: 'right' },
      { key: 'value', label: 'Achieved', type: 'money', align: 'right' },
      { key: 'percent', label: 'Achievement', type: 'progress', width: 190 },
    ],
    trend: [
      { key: 'month', label: 'Month', render: (r) => monthLabel(r.month), value: (r) => r.month },
      { key: 'qty', label: 'Pieces', type: 'number', align: 'right' },
      { key: 'value', label: 'Sales', type: 'money', align: 'right' },
    ],
  };
  const pivotCols = pivot && [
    { key: 'party', label: 'Party', render: (r) => <div><p className="font-medium text-ink">{r.party}</p><p className="text-xs text-muted">{r.city}</p></div>, value: (r) => r.party },
    ...pivot.brands.map((b) => ({ key: b, label: b, align: 'right', render: (r) => (r[b] ? <span className="tabular-nums">{money(r[b])}</span> : <span className="text-muted/50">-</span>), value: (r) => (r[b] ? r[b] / 100 : '') })),
    { key: 'total', label: 'Total', type: 'money', align: 'right', render: (r) => <span className="font-semibold tabular-nums">{money(r.total)}</span>, value: (r) => r.total / 100 },
  ];

  const tableCols = pivot ? pivotCols : cols[tab];
  const tableRows = pivot ? pivot.rows : rows;
  const labelKey = { 'brand-sales': 'brand', 'party-sales': 'party', 'employee-performance': 'employee', trend: 'month' }[tab];

  const exportCsv = () => downloadCsv(`${tab}-${range.from}-to-${range.to}.csv`,
    tableCols.map((c) => ({ label: c.label, key: c.key, value: c.value || (c.type === 'money' ? (r) => r[c.key] / 100 : undefined) })), tableRows);

  const chart = () => {
    if (q.isLoading) return <Skeleton className="m-4 h-64" />;
    if (!tableRows.length) return null;
    if (tab === 'trend') {
      return (
        <ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ left: 4, right: 16, top: 8 }}>
          <CartesianGrid vertical={false} stroke={grid} />
          <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fill: text, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={moneyCompact} tick={{ fill: text, fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
          <Tooltip content={<Tip />} /><Line type="monotone" dataKey="value" name="Sales" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart></ResponsiveContainer>
      );
    }
    if (tab === 'party-brand') {
      const top = pivot.rows.slice(0, 8);
      return (
        <ResponsiveContainer width="100%" height="100%"><BarChart data={top} margin={{ left: 4, right: 16, top: 8 }}>
          <CartesianGrid vertical={false} stroke={grid} />
          <XAxis dataKey="party" tick={{ fill: text, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} tickFormatter={(s) => (s.length > 11 ? `${s.slice(0, 10)}...` : s)} />
          <YAxis tickFormatter={moneyCompact} tick={{ fill: text, fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
          <Tooltip content={<Tip />} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          {pivot.brands.map((b, i) => <Bar key={b} dataKey={b} stackId="a" fill={COLORS[i % COLORS.length]} name={b} />)}
        </BarChart></ResponsiveContainer>
      );
    }
    const data = (tab === 'party-sales' ? rows.slice(0, 10) : rows);
    return (
      <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ left: 4, right: 16, top: 8 }}>
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis dataKey={labelKey} tick={{ fill: text, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} tickFormatter={(s) => (String(s).length > 12 ? `${String(s).slice(0, 11)}...` : s)} />
        <YAxis tickFormatter={moneyCompact} tick={{ fill: text, fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
        <Tooltip content={<Tip />} cursor={{ fill: grid, opacity: 0.4 }} />
        <Bar dataKey="value" name="Sales" fill="#4f46e5" radius={[8, 8, 0, 0]} maxBarSize={44} />
        {tab === 'employee-performance' && <Bar dataKey="target" name="Target" fill="#0d9488" radius={[8, 8, 0, 0]} maxBarSize={44} />}
        {tab === 'employee-performance' && <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />}
      </BarChart></ResponsiveContainer>
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Reports" subtitle="Sales from confirmed bookings, limited to the data you are allowed to see."
        actions={<Button variant="secondary" icon={Download} onClick={exportCsv} disabled={!tableRows.length}>Export CSV</Button>} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
        <div className="flex flex-wrap items-center gap-2">
          <Tabs tabs={PRESETS.map((p) => ({ key: p.key, label: p.label }))} value={preset} onChange={(k) => { setPreset(k); setRange(PRESETS.find((p) => p.key === k).range()); }} />
          <input type="date" value={range.from} max={range.to} onChange={(e) => { setPreset(''); setRange({ ...range, from: e.target.value }); }} className="input !h-10 !w-auto !py-0" aria-label="From date" />
          <span className="text-xs text-muted">to</span>
          <input type="date" value={range.to} min={range.from} onChange={(e) => { setPreset(''); setRange({ ...range, to: e.target.value }); }} className="input !h-10 !w-auto !py-0" aria-label="To date" />
        </div>
      </div>

      {q.isError && <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{errorMessage(q.error)}</p>}

      <div className="grid gap-6">
        <Card>
          <CardHeader title={TABS.find((t) => t.key === tab).label} subtitle={tab === 'employee-performance' ? 'Achieved vs target' : `Total: ${money(total)} - ${number(rows.length)} rows`} />
          <div className="h-72 px-2 pb-4 pt-3">{chart() || <p className="py-24 text-center text-sm text-muted">No sales in this period.</p>}</div>
        </Card>
        <Card className="overflow-hidden"><DataTable columns={tableCols || []} rows={tableRows.map((r, i) => ({ ...r, _id: r._id || r.partyId || r.employeeId || r.brandId || r.month || `${r.party}-${r.brand}-${i}` }))} loading={q.isLoading} /></Card>
      </div>
    </div>
  );
}
