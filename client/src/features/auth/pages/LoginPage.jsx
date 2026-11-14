import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthCard, { FormAlert } from '../AuthCard.jsx';
import TextField from '../../../components/ui/TextField.jsx';
import PasswordField from '../../../components/ui/PasswordField.jsx';
import Button from '../../../components/ui/Button.jsx';
import { useForm } from '../../../hooks/useForm.js';
import { api } from '../../../api/index.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { isEmail } from '../../../utils/validators.js';

export default function LoginPage() {
  const f = useForm({ email: '', password: '', remember: false });
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { signIn } = useAuth();
  const returnTo = params.get('returnTo');

  const validate = (v) => ({ ...(isEmail(v.email) ? {} : { email: 'Enter a valid email address' }), ...(v.password ? {} : { password: 'Enter your password' }) });
  const submit = async (v) => {
    const email = v.email.trim().toLowerCase();
    try {
      const res = await api.auth.login({ email, password: v.password, remember: v.remember });
      signIn(res.token, res.user);
      nav(returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/dashboard', { replace: true });
    } catch (e) {
      if (e.code === 'EMAIL_NOT_VERIFIED') { sessionStorage.setItem('ff_pending_email', email); nav('/verify-email', { state: { email } }); return; }
      throw e;
    }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to order and track your pizza." footer={<>New here? <Link to="/register" className="font-semibold text-brick underline">Create an account</Link></>}>
      <form onSubmit={f.handle(validate, submit)} noValidate className="space-y-4">
        <FormAlert>{f.formError}</FormAlert>
        <TextField label="Email" type="email" autoComplete="email" {...f.bind('email')} />
        <PasswordField label="Password" autoComplete="current-password" {...f.bind('password')} />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-tomato" {...f.bind('remember', 'checkbox')} /> Remember me</label>
          <Link to="/forgot-password" className="font-semibold text-brick underline">Forgot password?</Link>
        </div>
        <Button type="submit" loading={f.busy} className="w-full">Sign in</Button>
      </form>
    </AuthCard>
  );
}
