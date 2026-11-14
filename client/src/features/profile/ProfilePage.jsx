import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import TextField from '../../components/ui/TextField.jsx';
import PasswordField from '../../components/ui/PasswordField.jsx';
import AddressForm from '../../components/domain/AddressForm.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { FormAlert } from '../auth/AuthCard.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useForm } from '../../hooks/useForm.js';
import { api } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { isPhone } from '../../utils/validators.js';
import { isStrongPassword } from '../../utils/passwordRules.js';

function PersonalInfo() {
  const { who, setWho } = useAuth();
  const toast = useToast();
  const f = useForm({ name: who.name, phone: who.phone ?? '' });
  const validate = (v) => ({ ...(v.name.trim().length >= 2 ? {} : { name: 'Enter your name' }), ...(isPhone(v.phone) ? {} : { phone: 'Enter a valid phone number' }) });
  const submit = async (v) => { setWho(await api.profile.update({ name: v.name.trim(), phone: v.phone.trim() })); toast('Profile updated', { type: 'success', ms: 3000 }); };
  return (
    <section className="card p-5" aria-labelledby="pi-h">
      <h2 id="pi-h" className="text-lg font-bold">Personal information</h2>
      <form onSubmit={f.handle(validate, submit)} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormAlert>{f.formError}</FormAlert>
        <TextField label="Full name" autoComplete="name" {...f.bind('name')} />
        <TextField label="Phone" type="tel" autoComplete="tel" {...f.bind('phone')} />
        <TextField label="Email" value={who.email} readOnly hint="Email cannot be changed here." className="sm:col-span-2" />
        <div className="sm:col-span-2"><Button type="submit" loading={f.busy}>Save changes</Button></div>
      </form>
    </section>
  );
}

function Addresses() {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => api.profile.addresses(), []);
  const [editing, setEditing] = useState(null); // 'new' | address id
  const done = async () => { setEditing(null); await reload(true); };
  const save = (id) => async (v) => { await (id === 'new' ? api.profile.addAddress(v) : api.profile.updateAddress(id, v)); toast('Address saved', { type: 'success', ms: 3000 }); await done(); };
  const remove = async (a) => { if (!window.confirm(`Remove the ${a.label} address?`)) return; await api.profile.removeAddress(a.id); toast('Address removed', { type: 'info', ms: 3000 }); await reload(true); };
  const makeDefault = async (a) => { await api.profile.updateAddress(a.id, { isDefault: true }); await reload(true); };
  return (
    <section className="card p-5" aria-labelledby="ad-h">
      <div className="flex items-center justify-between"><h2 id="ad-h" className="text-lg font-bold">Saved delivery addresses</h2>{editing !== 'new' && <Button size="sm" variant="outline" onClick={() => setEditing('new')}><Icon name="add" />Add address</Button>}</div>
      <div className="mt-4 space-y-3">
        {editing === 'new' && <AddressForm onSubmit={save('new')} onCancel={() => setEditing(null)} />}
        {loading ? <Skeleton className="h-20" /> : error ? <ErrorState error={error} onRetry={reload} /> : !data.length && editing !== 'new' ? <EmptyState icon="location_off" title="No saved addresses">Add one to check out faster.</EmptyState> : data.map((a) => (
          <div key={a.id} className="rounded-md border border-line p-4">
            {editing === a.id ? <AddressForm initial={a} onSubmit={save(a.id)} onCancel={() => setEditing(null)} /> : (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="text-sm"><strong>{a.label}</strong>{a.isDefault && <span className="ml-2 rounded-full bg-basil px-2 py-0.5 text-xs font-semibold text-white">Default</span>}<br />{[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ')}{a.instructions && <><br /><span className="muted">{a.instructions}</span></>}</p>
                <div className="flex gap-1">{!a.isDefault && <Button size="sm" variant="ghost" onClick={() => makeDefault(a)}>Make default</Button>}<Button size="sm" variant="ghost" onClick={() => setEditing(a.id)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => remove(a)}>Remove</Button></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Security() {
  const { signIn } = useAuth();
  const toast = useToast();
  const f = useForm({ currentPassword: '', newPassword: '', confirm: '' });
  const validate = (v) => ({
    ...(v.currentPassword ? {} : { currentPassword: 'Enter your current password' }),
    ...(isStrongPassword(v.newPassword) ? {} : { newPassword: 'Your password does not meet all the rules below' }),
    ...(v.newPassword === v.currentPassword && v.newPassword ? { newPassword: 'Choose a different password from the current one' } : {}),
    ...(v.confirm === v.newPassword ? {} : { confirm: 'Passwords do not match' }),
  });
  const submit = async (v) => {
    const res = await api.auth.changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword });
    signIn(res.token, res.user); // old sessions on other devices are now signed out
    f.setValues({ currentPassword: '', newPassword: '', confirm: '' });
    toast('Password changed. Other devices were signed out.', { type: 'success' });
  };
  return (
    <section className="card p-5" aria-labelledby="sec-h">
      <h2 id="sec-h" className="text-lg font-bold">Security</h2>
      <form onSubmit={f.handle(validate, submit)} noValidate className="mt-4 max-w-md space-y-4">
        <FormAlert>{f.formError}</FormAlert>
        <PasswordField label="Current password" autoComplete="current-password" {...f.bind('currentPassword')} />
        <PasswordField label="New password" autoComplete="new-password" showRules {...f.bind('newPassword')} />
        <PasswordField label="Confirm new password" autoComplete="new-password" {...f.bind('confirm')} />
        <Button type="submit" loading={f.busy}>Change password</Button>
      </form>
    </section>
  );
}

export default function ProfilePage() {
  const { signOut } = useAuth();
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Your profile</h1>
      <PersonalInfo />
      <Addresses />
      <Security />
      <div className="flex justify-between"><Button to="/orders" variant="outline">View my orders</Button><Button variant="ghost" onClick={() => { signOut(); nav('/'); }}><Icon name="logout" />Sign out</Button></div>
    </div>
  );
}
