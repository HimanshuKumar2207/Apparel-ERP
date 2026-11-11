import { KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../app/AuthContext';
import DynamicForm from '../components/form/DynamicForm';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';

export const passwordFields = [
  { name: 'currentPassword', label: 'Current password', type: 'password', required: true, autoComplete: 'current-password' },
  { name: 'newPassword', label: 'New password', type: 'password', required: true, autoComplete: 'new-password', hint: '10+ characters with upper, lower, number and symbol' },
  { name: 'confirm', label: 'Confirm new password', type: 'password', required: true, autoComplete: 'new-password', payload: false },
];

/** Forced screen shown right after the first sign-in with a temporary password. */
export default function ChangePasswordPage() {
  const { user, applySession, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md animate-fade-in p-7">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand"><KeyRound className="h-6 w-6" /></div>
        <h1 className="text-xl font-semibold tracking-tight">Set your own password</h1>
        <p className="mt-1.5 text-sm text-muted">Hi {user.name.split(' ')[0]}, you signed in with a temporary password. Choose a new one to continue.</p>
        <div className="mt-6">
          <DynamicForm fields={passwordFields} submitLabel="Update password"
            onSubmit={async (payload, values) => {
              if (values.confirm !== values.newPassword) throw new Error('The two passwords do not match');
              const { data } = await api.post('/auth/change-password', payload);
              applySession(data);
              toast.success('Password updated');
              nav('/', { replace: true });
            }} />
        </div>
        <button onClick={logout} className="mt-4 w-full text-center text-sm text-muted hover:text-ink">Sign out</button>
      </Card>
    </div>
  );
}
