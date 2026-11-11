import { Play } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../../lib/api';
import { isoDay } from '../../lib/format';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';

/** Month picker + "Run payroll" (creates draft salary records; existing months are never overwritten). */
export default function PayrollRun({ ctx }) {
  const [month, setMonth] = useState(isoDay().slice(0, 7));
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!ctx.can('salary', 'add')) return null;

  const run = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/salary/run', { month });
      toast.success(`${data.data.created} salary record(s) created${data.data.skipped ? `, ${data.data.skipped} already existed` : ''}`);
      setOpen(false);
      ctx.refresh();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <>
      <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input !h-10 !w-auto !py-0" aria-label="Payroll month" />
      <Button icon={Play} variant="secondary" onClick={() => setOpen(true)} disabled={!month}>Run payroll</Button>
      <ConfirmDialog open={open} onClose={() => setOpen(false)} loading={busy} title="Run payroll" confirmLabel="Run payroll" onConfirm={run}
        message={`Create draft salary records for ${month}? Existing records for that month are left untouched. Employees with no attendance for the month are paid for the full month.`} />
    </>
  );
}
