import { Link, useNavigate } from 'react-router-dom';
import AuthCard, { FormAlert } from '../AuthCard.jsx';
import TextField from '../../../components/ui/TextField.jsx';
import PasswordField from '../../../components/ui/PasswordField.jsx';
import Button from '../../../components/ui/Button.jsx';
import { useForm } from '../../../hooks/useForm.js';
import { api } from '../../../api/index.js';
import { isEmail, isPhone } from '../../../utils/validators.js';
import { isStrongPassword } from '../../../utils/passwordRules.js';
import { useToast } from '../../../context/ToastContext.jsx';

export default function RegisterPage() {
  const f = useForm({ name: '', email: '', phone: '', password: '', confirm: '', acceptTerms: false });
  const nav = useNavigate();
  const toast = useToast();

  const validate = (v) => {
    const e = {};
    if (v.name.trim().length < 2) e.name = 'Enter your name';
    if (!isEmail(v.email)) e.email = 'Enter a valid email address';
    if (!isPhone(v.phone)) e.phone = 'Enter a valid phone number';
    if (!isStrongPassword(v.password)) e.password = 'Your password does not meet all the rules below';
    if (v.confirm !== v.password) e.confirm = 'Passwords do not match';
    if (!v.acceptTerms) e.acceptTerms = 'You must accept the terms to continue';
    return e;
  };

  const submit = async (v) => {
    const email = v.email.trim().toLowerCase();
    const res = await api.auth.register({ name: v.name.trim(), email, phone: v.phone.trim(), password: v.password, acceptTerms: true });
    sessionStorage.setItem('ff_pending_email', email);
    toast(res.message, { type: 'success' });
    nav('/verify-email', { state: { email, demo: res.demo } });
  };

  return (
    <AuthCard title="Create your account" subtitle="Order wood-fired pizza in a few taps." footer={<>Already have an account? <Link to="/login" className="font-semibold text-brick underline">Sign in</Link></>}>
      <form onSubmit={f.handle(validate, submit)} noValidate className="space-y-4">
        <FormAlert>{f.formError}</FormAlert>
        <TextField label="Full name" autoComplete="name" {...f.bind('name')} />
        <TextField label="Email" type="email" autoComplete="email" {...f.bind('email')} />
        <TextField label="Phone" type="tel" autoComplete="tel" hint="Used for delivery updates." {...f.bind('phone')} />
        <PasswordField label="Password" autoComplete="new-password" showRules {...f.bind('password')} />
        <PasswordField label="Confirm password" autoComplete="new-password" {...f.bind('confirm')} />
        <div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 accent-tomato" {...f.bind('acceptTerms', 'checkbox')} /> I accept the terms of service and privacy policy.</label>
          {f.errors.acceptTerms && <p className="field-error">{f.errors.acceptTerms}</p>}
        </div>
        <Button type="submit" loading={f.busy} className="w-full">Create account and verify email</Button>
      </form>
    </AuthCard>
  );
}
