import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon.jsx';
import Button from '../../../components/ui/Button.jsx';
import TextField from '../../../components/ui/TextField.jsx';
import PasswordField from '../../../components/ui/PasswordField.jsx';
import { FormAlert } from '../../auth/AuthCard.jsx';
import { useForm } from '../../../hooks/useForm.js';
import { api, API_MODE } from '../../../api/index.js';
import { useAdminAuth } from '../../../context/AdminAuthContext.jsx';
import { isEmail } from '../../../utils/validators.js';

// Not linked from anywhere in the customer UI. Admin accounts are created with `npm run seed:admin`.
export default function AdminLoginPage() {
  const f = useForm({ email: '', password: '' });
  const nav = useNavigate();
  const { signIn } = useAdminAuth();
  const validate = (v) => ({ ...(isEmail(v.email) ? {} : { email: 'Enter your admin email' }), ...(v.password ? {} : { password: 'Enter your password' }) });
  const submit = async (v) => { const r = await api.admin.login({ email: v.email.trim().toLowerCase(), password: v.password }); signIn(r.token, r.admin); nav('/admin', { replace: true }); };
  return (
    <div data-theme="dark" className="on-dark flex min-h-screen items-center justify-center bg-pan px-4 text-parchment">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center gap-2 font-display text-xl font-extrabold text-crust"><Icon name="local_fire_department" className="text-3xl text-cheese" />Kitchen console</div>
        <h1 className="mt-6 text-2xl font-bold">Staff sign in</h1>
        <p className="muted mt-1 text-sm">Restricted area. Authorised staff only.</p>
        {API_MODE === 'mock' && <p className="mt-4 rounded-md border-2 border-dashed border-cheese bg-cheese/10 px-3 py-2 text-sm"><strong>Demo mode:</strong> use <code>admin@example.com</code> and <code>Admin#12345</code>.</p>}
        <form onSubmit={f.handle(validate, submit)} noValidate className="mt-6 space-y-4">
          <FormAlert>{f.formError}</FormAlert>
          <TextField label="Email" type="email" autoComplete="username" {...f.bind('email')} />
          <PasswordField label="Password" autoComplete="current-password" {...f.bind('password')} />
          <Button type="submit" loading={f.busy} className="w-full">Sign in</Button>
        </form>
      </div>
    </div>
  );
}
