import { Eye, EyeOff, Lock, Mail, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { errorMessage } from '../lib/api';

const points = [
  { icon: TrendingUp, title: 'Brand-wise sales and targets', text: 'See achievement against target for every brand, party and salesperson.' },
  { icon: Users, title: 'Your whole distribution team', text: 'Employees, parties, bookings, salary and attendance in one place.' },
  { icon: ShieldCheck, title: 'Built secure', text: 'Role-based access, two-factor sign-in and a full audit trail.' },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', otp: '' });
  const [needOtp, setNeedOtp] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await login(form.email.trim(), form.password, needOtp ? form.otp : undefined);
      if (res.twoFactorRequired) setNeedOtp(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-teal-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <svg viewBox="0 0 32 32" className="h-6 w-6" fill="currentColor"><path d="M11 8l-5 4 2.5 3L11 14v10h10V14l2.5 1 2.5-3-5-4c-.6 1.6-2.2 2.6-5 2.6S11.6 9.6 11 8z" /></svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">Apparel ERP</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">Run your clothing distribution business from one screen.</h1>
          <ul className="mt-10 space-y-6">
            {points.map((p) => (
              <li key={p.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15"><p.icon className="h-5 w-5" /></div>
                <div><p className="font-medium">{p.title}</p><p className="mt-0.5 text-sm text-white/75">{p.text}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/60">Authorized users only. Activity is logged.</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm animate-fade-in" noValidate>
          <div className="mb-8 lg:hidden"><p className="text-lg font-semibold tracking-tight">Apparel ERP</p></div>
          <h2 className="text-2xl font-semibold tracking-tight">{needOtp ? 'Two-step verification' : 'Welcome back'}</h2>
          <p className="mt-1.5 text-sm text-muted">{needOtp ? 'Enter the 6-digit code from your authenticator app.' : 'Sign in to continue to your workspace.'}</p>

          <div className="mt-8 space-y-4">
            {!needOtp ? (
              <>
                <Field label="Email">
                  <div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input type="email" autoComplete="username" autoFocus value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-10" placeholder="you@company.com" required /></div>
                </Field>
                <Field label="Password">
                  <div className="relative"><Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="px-10" placeholder="Your password" required />
                    <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
                </Field>
              </>
            ) : (
              <Field label="Authentication code">
                <Input inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })} className="text-center text-lg tracking-[0.5em]" placeholder="000000" />
              </Field>
            )}
            {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</div>}
            <Button type="submit" size="lg" className="w-full" loading={busy} disabled={needOtp ? form.otp.length !== 6 : !form.email || !form.password}>{needOtp ? 'Verify and sign in' : 'Sign in'}</Button>
            {needOtp && <button type="button" onClick={() => { setNeedOtp(false); setForm({ ...form, otp: '' }); setError(''); }} className="w-full text-center text-sm text-muted hover:text-ink">Back</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
