import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ClipboardList, IndianRupee, ShieldCheck, Store, Users, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../app/AuthContext';
import { useTheme } from '../app/ThemeContext';
import { Card, CardHeader } from '../components/ui/Card';
import { Avatar, EmptyState, PageHeader, ProgressBar, Skeleton, StatCard } from '../components/ui/Misc';
import { api, errorMessage } from '../lib/api';
import { greeting, money, moneyCompact, monthLabel, number } from '../lib/format';

const PALETTE = {
  light: { brand: '#4f46e5', accent: '#0d9488', grid: '#e3e7f1', text: '#647085' },
  dark: { brand: '#818cf8', accent: '#2dd4bf', grid: '#282f42', text: '#96a0b6' },
};

function ChartTip({ active, payload, label, labelFmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-medium text-ink">{labelFmt ? labelFmt(label) : label}</p>
      {payload.map((p) => <p key={p.dataKey} className="tabular-nums text-muted">{money(p.value)}</p>)}
    </div>
  );
}

export default function DashboardPage() {
  const { user, can } = useAuth();
  const { dark } = useTheme();
  const c = dark ? PALETTE.dark : PALETTE.light;
  const q = useQuery({ queryKey: ['dashboard'], queryFn: async () => (await api.get('/dashboard')).data.data, refetchInterval: 60_000 });
  const d = q.data;
  const k = d?.kpis;
  const delta = k && k.salesLastMonth > 0 ? ((k.salesThisMonth - k.salesLastMonth) / k.salesLastMonth) * 100 : null;
  const isSales = user.role === 'salesperson';

  if (q.isError) return <EmptyState icon={AlertCircle} title="Could not load the dashboard" message={errorMessage(q.error)} />;

  return (
    <div className="animate-fade-in">
      <PageHeader title={`${greeting()}, ${user.name.split(' ')[0]}`} subtitle={isSales ? 'Your numbers for this month.' : 'Here is how the business is doing this month.'} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sales this month" icon={IndianRupee} loading={q.isLoading} value={k && moneyCompact(k.salesThisMonth)} delta={delta} hint={delta != null ? 'vs last month' : 'Confirmed bookings'} />
        <StatCard label="Bookings" icon={ClipboardList} tone="info" loading={q.isLoading} value={k && number(k.bookingsThisMonth)} hint="This month" />
        <StatCard label="Outstanding" icon={Wallet} tone="warn" loading={q.isLoading} value={k && moneyCompact(k.outstanding)} hint="Yet to be collected" />
        {can('bookings', 'approve') ? (
          <Link to="/bookings"><StatCard label="Pending approvals" icon={ShieldCheck} tone={k?.pendingApprovals ? 'danger' : 'success'} loading={q.isLoading} value={k && number(k.pendingApprovals)} hint={k?.pendingApprovals ? 'Needs your decision' : 'All clear'} /></Link>
        ) : (
          <StatCard label={isSales ? 'My parties' : 'Active parties'} icon={Store} tone="success" loading={q.isLoading} value={k && number(k.activeParties)} hint="In your scope" />
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Sales trend" subtitle="Confirmed sales, last 6 months" />
          <div className="h-72 px-2 pb-4 pt-3">
            {q.isLoading ? <Skeleton className="m-3 h-60" /> : d.trend.length === 0 ? <EmptyState title="No sales yet" message="Confirmed bookings will appear here." /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.trend} margin={{ left: 4, right: 16, top: 8 }}>
                  <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.brand} stopOpacity={0.35} /><stop offset="100%" stopColor={c.brand} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke={c.grid} />
                  <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fill: c.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={moneyCompact} tick={{ fill: c.text, fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
                  <Tooltip content={<ChartTip labelFmt={monthLabel} />} cursor={{ stroke: c.grid }} />
                  <Area type="monotone" dataKey="value" stroke={c.brand} strokeWidth={2.5} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Brand-wise sales" subtitle="This month" />
          <div className="h-72 px-2 pb-4 pt-3">
            {q.isLoading ? <Skeleton className="m-3 h-60" /> : d.brands.length === 0 ? <EmptyState title="No brand sales yet" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.brands} layout="vertical" margin={{ left: 4, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke={c.grid} />
                  <XAxis type="number" tickFormatter={moneyCompact} tick={{ fill: c.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="brand" width={86} tick={{ fill: c.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: c.grid, opacity: 0.4 }} />
                  <Bar dataKey="value" fill={c.accent} radius={[0, 8, 8, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Target progress" subtitle="Live, from confirmed bookings" action={<Link to="/targets" className="text-xs font-medium text-brand hover:underline">View all</Link>} />
          <ul className="space-y-4 px-5 pb-5 pt-4">
            {q.isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />) : d.targets.length === 0 ? <EmptyState title="No active targets" /> : d.targets.map((t) => (
              <li key={t._id}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-ink">{isSales ? t.brand?.name : `${t.employee?.name} - ${t.brand?.name}`}</span>
                  <span className="shrink-0 text-xs text-muted tabular-nums">{moneyCompact(t.achievedValue)} / {moneyCompact(t.targetValue)}</span>
                </div>
                <ProgressBar value={t.percent} />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Top parties" subtitle="By sales this month" />
          <ul className="divide-y divide-line px-5 pb-3 pt-2">
            {q.isLoading ? Array.from({ length: 5 }).map((_, i) => <li key={i} className="py-3"><Skeleton className="h-9" /></li>) : d.parties.length === 0 ? <EmptyState title="No party sales yet" /> : d.parties.map((p) => (
              <li key={p.partyId} className="flex items-center gap-3 py-3">
                <Avatar name={p.party} size="sm" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{p.party}</p><p className="text-xs text-muted">{p.city || '-'} - {p.bookings} booking{p.bookings === 1 ? '' : 's'}</p></div>
                <span className="text-sm font-semibold tabular-nums">{moneyCompact(p.value)}</span>
              </li>
            ))}
          </ul>
        </Card>

        {!isSales ? (
          <Card>
            <CardHeader title="Sales team" subtitle="Achievement this month" action={k?.activeEmployees != null && <span className="inline-flex items-center gap-1 text-xs text-muted"><Users className="h-3.5 w-3.5" />{k.activeEmployees} active</span>} />
            <ul className="space-y-4 px-5 pb-5 pt-4">
              {q.isLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />) : d.leaderboard.length === 0 ? <EmptyState title="No data yet" /> : d.leaderboard.map((e, i) => (
                <li key={e.employeeId}>
                  <div className="mb-1.5 flex items-center justify-between text-sm"><span className="flex items-center gap-2 font-medium text-ink"><span className="w-4 text-xs text-muted">{i + 1}</span>{e.employee}</span><span className="text-xs text-muted tabular-nums">{moneyCompact(e.value)}</span></div>
                  {e.percent != null ? <ProgressBar value={e.percent} /> : <p className="text-xs text-muted">No target set</p>}
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card><CardHeader title="Tip" /><p className="px-5 pb-5 pt-3 text-sm leading-relaxed text-muted">Check in from the Attendance page each day, and keep your bookings in <b>Booked</b> status so your manager can confirm them. Confirmed bookings count towards your targets.</p></Card>
        )}
      </div>
    </div>
  );
}
