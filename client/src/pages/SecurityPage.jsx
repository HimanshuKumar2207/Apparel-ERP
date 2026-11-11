import { CheckCircle2, LogOut, ShieldAlert, ShieldCheck, Smartphone } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../app/AuthContext';
import DynamicForm from '../components/form/DynamicForm';
import Button from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Field, Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/Misc';
import { api, errorMessage } from '../lib/api';
import { dateTime, titleCase } from '../lib/format';
import { passwordFields } from './ChangePasswordPage';

function TwoFactor() {
  const { user, reloadUser, isSuper } = useAuth();
  const [setup, setSetup] = useState(null);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const start = async () => { setBusy(true); try { setSetup((await api.post('/auth/2fa/setup')).data); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); } };
  const enable = async () => {
    setBusy(true);
    try { await api.post('/auth/2fa/enable', { otp }); toast.success('Two-factor authentication is on'); setSetup(null); setOtp(''); await reloadUser(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader title="Two-factor authentication" subtitle="Add a one-time code from an authenticator app to every sign-in."
        action={user.twoFactorEnabled ? <Badge tone="success" dot>Enabled</Badge> : <Badge tone="warn" dot>Not enabled</Badge>} />
      <div className="px-5 pb-5 pt-4">
        {user.twoFactorSetupRequired && (
          <div className="mb-4 flex gap-3 rounded-xl border border-warn/30 bg-warn/10 p-3.5 text-sm text-warn"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p>Your company requires Super Admins to use two-factor authentication. Finish setup below to continue.</p></div>
        )}
        {!user.twoFactorEnabled && !setup && <Button icon={Smartphone} onClick={start} loading={busy}>Set up authenticator app</Button>}
        {setup && (
          <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
            <img src={setup.qr} alt="Scan this QR code with your authenticator app" className="h-44 w-44 rounded-xl border border-line bg-white p-2" />
            <div className="space-y-3">
              <p className="text-sm text-muted">1. Scan the QR code with Google Authenticator, Microsoft Authenticator or any TOTP app.<br />2. Enter the 6-digit code it shows.</p>
              <p className="break-all rounded-lg bg-surface2 px-3 py-2 font-mono text-xs text-muted">Manual key: {setup.secret}</p>
              <Field label="6-digit code"><Input inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" /></Field>
              <div className="flex gap-2"><Button onClick={enable} loading={busy} disabled={otp.length !== 6}>Turn on</Button><Button variant="secondary" onClick={() => setSetup(null)}>Cancel</Button></div>
            </div>
          </div>
        )}
        {user.twoFactorEnabled && !isSuper && !disabling && <Button variant="secondary" onClick={() => setDisabling(true)}>Turn off two-factor</Button>}
        {user.twoFactorEnabled && isSuper && <p className="flex items-center gap-2 text-sm text-muted"><CheckCircle2 className="h-4 w-4 text-success" />Super Admin accounts keep two-factor enabled.</p>}
        {disabling && (
          <DynamicForm submitLabel="Turn off" onCancel={() => setDisabling(false)}
            fields={[{ name: 'password', label: 'Password', type: 'password', required: true }, { name: 'otp', label: 'Current 6-digit code', required: true, maxLength: 6 }]}
            onSubmit={async (p) => { await api.post('/auth/2fa/disable', p); toast.success('Two-factor turned off'); setDisabling(false); await reloadUser(); }} />
        )}
      </div>
    </Card>
  );
}

export default function SecurityPage() {
  const { user, applySession, logout } = useAuth();
  const [formKey, setFormKey] = useState(0);

  const signOutAll = async () => {
    try { await api.post('/auth/logout-all'); toast.success('Signed out of all devices'); await logout(); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Security" subtitle="Manage your sign-in, password and active sessions." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Your account" />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-5 pb-5 pt-4 text-sm">
            <div><dt className="text-xs text-muted">Name</dt><dd className="mt-0.5 font-medium">{user.name}</dd></div>
            <div><dt className="text-xs text-muted">Email</dt><dd className="mt-0.5 break-all font-medium">{user.email}</dd></div>
            <div><dt className="text-xs text-muted">Role</dt><dd className="mt-1"><Badge tone={user.role === 'superAdmin' ? 'brand' : 'info'}>{titleCase(user.role)}</Badge></dd></div>
            <div><dt className="text-xs text-muted">Last sign-in</dt><dd className="mt-0.5 font-medium">{dateTime(user.lastLoginAt)}</dd></div>
          </dl>
        </Card>
        <TwoFactor />
        <Card>
          <CardHeader title="Change password" subtitle="Other devices are signed out when you change it." />
          <div className="px-5 pb-5 pt-4">
            <DynamicForm key={formKey} fields={passwordFields} submitLabel="Update password"
              onSubmit={async (payload, values) => {
                if (values.confirm !== values.newPassword) throw new Error('The two passwords do not match');
                const { data } = await api.post('/auth/change-password', payload);
                applySession(data);
                toast.success('Password updated');
                setFormKey((k) => k + 1);
              }} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Sessions" subtitle="Lost a device or used a shared computer? End every session." />
          <div className="px-5 pb-5 pt-4"><Button variant="secondary" icon={LogOut} onClick={signOutAll}>Sign out of all devices</Button></div>
          <div className="flex items-start gap-3 border-t border-line px-5 py-4 text-xs text-muted"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />Access tokens expire after 15 minutes and refresh tokens are rotated on every use.</div>
        </Card>
      </div>
    </div>
  );
}
