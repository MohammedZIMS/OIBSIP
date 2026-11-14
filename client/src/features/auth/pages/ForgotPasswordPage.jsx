import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthCard, { DemoHint, FormAlert } from '../AuthCard.jsx';
import TextField from '../../../components/ui/TextField.jsx';
import Button from '../../../components/ui/Button.jsx';
import Icon from '../../../components/ui/Icon.jsx';
import { useForm } from '../../../hooks/useForm.js';
import { useCountdown } from '../../../hooks/useCountdown.js';
import { api } from '../../../api/index.js';
import { isEmail } from '../../../utils/validators.js';

export default function ForgotPasswordPage() {
  const f = useForm({ email: '' });
  const [sentTo, setSentTo] = useState('');
  const [demo, setDemo] = useState();
  const [left, start] = useCountdown(0);

  const send = async (email) => { const r = await api.auth.forgot(email); setSentTo(email); setDemo(r.demo); start(60); };
  const submit = (v) => send(v.email.trim().toLowerCase());

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter your email and we will send you a link to choose a new one." footer={<Link to="/login" className="font-semibold text-brick underline">Back to sign in</Link>}>
      {sentTo ? (
        <div role="status" className="space-y-4">
          <p className="flex items-start gap-2"><Icon name="mark_email_read" className="text-2xl text-basil" /><span>If an account exists for <strong>{sentTo}</strong>, a reset link is on its way. It expires in 1 hour.</span></p>
          {demo && <DemoHint>no email is sent. <Link className="font-semibold underline" to={`/reset-password?token=${demo.token}`}>Open the reset page</Link></DemoHint>}
          <Button variant="outline" disabled={left > 0} onClick={() => send(sentTo)} className="w-full">{left > 0 ? `Resend in ${left}s` : 'Resend link'}</Button>
        </div>
      ) : (
        <form onSubmit={f.handle((v) => (isEmail(v.email) ? {} : { email: 'Enter a valid email address' }), submit)} noValidate className="space-y-4">
          <FormAlert>{f.formError}</FormAlert>
          <TextField label="Email" type="email" autoComplete="email" {...f.bind('email')} />
          <Button type="submit" loading={f.busy} className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthCard>
  );
}
