import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AuthCard, { DemoHint, FormAlert } from '../AuthCard.jsx';
import TextField from '../../../components/ui/TextField.jsx';
import Button from '../../../components/ui/Button.jsx';
import { Spinner } from '../../../components/ui/States.jsx';
import { api } from '../../../api/index.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { useCountdown } from '../../../hooks/useCountdown.js';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { state } = useLocation();
  const nav = useNavigate();
  const toast = useToast();
  const { signIn, who } = useAuth();
  const token = params.get('token');
  const email = state?.email ?? who?.email ?? sessionStorage.getItem('ff_pending_email') ?? '';
  const [demo, setDemo] = useState(state?.demo);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(Boolean(token));
  const [left, startCooldown] = useCountdown(0);
  const ran = useRef(false);

  const done = (res) => { signIn(res.token, res.user); sessionStorage.removeItem('ff_pending_email'); toast('Email verified. Welcome!', { type: 'success' }); nav('/dashboard', { replace: true }); };

  useEffect(() => { // link from the email
    if (!token || ran.current) return;
    ran.current = true;
    api.auth.verifyEmail(token).then(done).catch((e) => { setError(e.message); setChecking(false); });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitCode = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from your email');
    setBusy(true); setError('');
    try { done(await api.auth.verifyCode({ email, code })); } catch (x) { setError(x.message); } finally { setBusy(false); }
  };
  const resend = async () => {
    try { const r = await api.auth.resend(email); setDemo(r.demo); toast('If that account needs verification, a new email is on its way.', { type: 'info' }); startCooldown(60); }
    catch (x) { setError(x.message); }
  };

  if (checking) return <Spinner label="Verifying your email" />;
  return (
    <AuthCard title="Check your email" subtitle={email ? <>We sent a verification link and a 6-digit code to <strong>{email}</strong>. They expire in 24 hours.</> : 'Enter the email you registered with, then request a new code.'}
      footer={<><Link to="/login" className="font-semibold text-brick underline">Back to sign in</Link></>}>
      {demo && <DemoHint>no email is sent. Your code is <strong>{demo.code}</strong>. <button type="button" className="font-semibold underline" onClick={() => api.auth.verifyEmail(demo.token).then(done).catch((e) => setError(e.message))}>Verify with the link instead</button></DemoHint>}
      <FormAlert>{error}</FormAlert>
      <form onSubmit={submitCode} noValidate className="space-y-4">
        <TextField label="Verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" />
        <Button type="submit" loading={busy} className="w-full">Verify email</Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="muted">Did not get it?</span>
        <Button variant="ghost" size="sm" onClick={resend} disabled={left > 0 || !email}>{left > 0 ? `Resend in ${left}s` : 'Resend email'}</Button>
      </div>
    </AuthCard>
  );
}
