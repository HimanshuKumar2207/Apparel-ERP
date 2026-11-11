import { Bell, ChevronDown, LogOut, Menu, Moon, ShieldCheck, Sun, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { useTheme } from '../../app/ThemeContext';
import { NAV } from '../../config/nav';
import { cn } from '../../lib/utils';
import { titleCase } from '../../lib/format';
import { Avatar } from '../ui/Misc';
import { Badge } from '../ui/Badge';

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent text-white shadow-sm">
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="currentColor"><path d="M11 8l-5 4 2.5 3L11 14v10h10V14l2.5 1 2.5-3-5-4c-.6 1.6-2.2 2.6-5 2.6S11.6 9.6 11 8z" /></svg>
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight text-ink">Apparel ERP</p>
        <p className="text-[11px] text-muted">Distribution suite</p>
      </div>
    </div>
  );
}

function Sidebar({ onNavigate }) {
  const { can } = useAuth();
  const groups = NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.module || can(i.module, 'view')) })).filter((g) => g.items.length);
  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5 scroll-thin" aria-label="Main">
      <Brand />
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/80">{g.label}</p>
          <ul className="space-y-0.5">
            {g.items.map((i) => (
              <li key={i.to}>
                <NavLink to={i.to} end={i.to === '/'} onClick={onNavigate}
                  className={({ isActive }) => cn('group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                    isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-surface2 hover:text-ink')}>
                  <i.icon className="h-[18px] w-[18px] shrink-0" />
                  {i.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 rounded-xl p-1.5 pr-2.5 transition hover:bg-surface2" aria-haspopup="menu" aria-expanded={open}>
        <Avatar name={user.name} size="sm" />
        <div className="hidden text-left leading-tight sm:block">
          <p className="max-w-[9rem] truncate text-sm font-medium text-ink">{user.name}</p>
          <p className="text-[11px] text-muted">{titleCase(user.role)}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-60 animate-fade-in overflow-hidden rounded-2xl border border-line bg-surface shadow-pop" role="menu">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <div className="mt-2 flex gap-1.5"><Badge tone={user.role === 'superAdmin' ? 'brand' : 'info'}>{titleCase(user.role)}</Badge>{user.twoFactorEnabled && <Badge tone="success" dot>2FA on</Badge>}</div>
          </div>
          <button onClick={() => { setOpen(false); nav('/security'); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-surface2" role="menuitem"><ShieldCheck className="h-4 w-4 text-muted" />Security and access</button>
          <button onClick={logout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/5" role="menuitem"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      )}
    </div>
  );
}

export default function AppShell() {
  const { dark, toggle } = useTheme();
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setDrawer(false); window.scrollTo({ top: 0 }); }, [pathname]);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block"><Sidebar /></aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-fade-in border-r border-line bg-surface shadow-pop">
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-muted hover:bg-surface2" aria-label="Close menu"><X className="h-5 w-5" /></button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-md sm:px-8">
          <button onClick={() => setDrawer(true)} className="rounded-xl p-2 text-muted hover:bg-surface2 lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <button onClick={toggle} className="rounded-xl p-2.5 text-muted transition hover:bg-surface2 hover:text-ink" aria-label="Toggle theme">{dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</button>
            <button className="rounded-xl p-2.5 text-muted transition hover:bg-surface2 hover:text-ink" aria-label="Notifications"><Bell className="h-[18px] w-[18px]" /></button>
            <div className="mx-2 h-6 w-px bg-line" />
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8"><Outlet /></main>
      </div>
    </div>
  );
}
