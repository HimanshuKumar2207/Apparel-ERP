import { LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../../lib/api';
import Button from '../ui/Button';

/** Salesperson self check-in / check-out (shown only to salespeople). */
export default function CheckInOut({ ctx }) {
  const [busy, setBusy] = useState('');
  if (ctx.user.role !== 'salesperson' || !ctx.can('attendance', 'add')) return null;
  const run = async (kind) => {
    setBusy(kind);
    try {
      await api.post(`/attendance/${kind}`);
      toast.success(kind === 'check-in' ? 'Checked in. Have a great day!' : 'Checked out');
      ctx.refresh();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(''); }
  };
  return (
    <>
      <Button icon={LogIn} loading={busy === 'check-in'} onClick={() => run('check-in')}>Check in</Button>
      <Button icon={LogOut} variant="secondary" loading={busy === 'check-out'} onClick={() => run('check-out')}>Check out</Button>
    </>
  );
}
