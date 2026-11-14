import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthCard, { FormAlert } from '../AuthCard.jsx';
import PasswordField from '../../../components/ui/PasswordField.jsx';
import Button from '../../../components/ui/Button.jsx';
import { Spinner } from '../../../components/ui/States.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { useForm } from '../../../hooks/useForm.js';
import { api } from '../../../api/index.js';
import { isStrongPassword } from '../../../utils/passwordRules.js';
import { useToast } from '../../../context/ToastContext.jsx';

export default function ResetPasswordPage() {
  const token = useSearchParams()[0].get('token') ?? '';
  const nav = useNavigate();
  const toast = useToast();
  const check = useAsync(() => api.auth.validateReset(token), [token]);
  const f = useForm({ password: '', confirm: '' });

  if (check.loading) return <Spinner label="Checking your link" />;
  if (check.error || !token) {
    return (
      <AuthCard title="This link has expired" subtitle="Reset links work once and last for 1 hour. Request a new one to continue.">
        <Button to="/forgot-password" className="w-full">Request a new link</Button>
      </AuthCard>
    );
  }

  const validate = (v) => ({
    ...(isStrongPassword(v.password) ? {} : { password: 'Your password does not meet all the rules below' }),
    ...(v.confirm === v.password ? {} : { confirm: 'Passwords do not match' }),
  });
  const submit = async (v) => { await api.auth.reset({ token, password: v.password }); toast('Password updated. Sign in with your new password.', { type: 'success' }); nav('/login', { replace: true }); };

  return (
    <AuthCard title="Choose a new password" subtitle={`Link verified. It expires in about ${check.data.minutesRemaining} minutes. Resetting signs you out on all other devices.`} footer={<Link to="/login" className="font-semibold text-brick underline">Back to sign in</Link>}>
      <form onSubmit={f.handle(validate, submit)} noValidate className="space-y-4">
        <FormAlert>{f.formError}</FormAlert>
        <PasswordField label="New password" autoComplete="new-password" showRules {...f.bind('password')} />
        <PasswordField label="Confirm new password" autoComplete="new-password" {...f.bind('confirm')} />
        <Button type="submit" loading={f.busy} className="w-full">Update password</Button>
      </form>
    </AuthCard>
  );
}
