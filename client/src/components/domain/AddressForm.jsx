import { useState } from 'react';
import TextField from '../ui/TextField.jsx';
import Button from '../ui/Button.jsx';

const EMPTY = { label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', instructions: '', isDefault: false };

export default function AddressForm({ initial, onSubmit, onCancel, submitLabel = 'Save address' }) {
  const [v, setV] = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!v.line1.trim()) er.line1 = 'Enter the street address';
    if (!v.city.trim()) er.city = 'Enter the city';
    if (!/^\d{6}$/.test(v.pincode)) er.pincode = 'Enter a 6-digit pincode';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try { await onSubmit(v); } catch (x) { setErrors(x.fieldErrors ?? { line1: x.message }); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="addr-label">Label</label>
        <select id="addr-label" className="input" value={v.label} onChange={set('label')}>
          <option>Home</option><option>Work</option><option>Other</option>
        </select>
      </div>
      <TextField className="sm:col-span-2" label="Street address" value={v.line1} onChange={set('line1')} error={errors.line1} autoComplete="address-line1" />
      <TextField className="sm:col-span-2" label="Apartment, floor (optional)" value={v.line2} onChange={set('line2')} autoComplete="address-line2" />
      <TextField label="City" value={v.city} onChange={set('city')} error={errors.city} autoComplete="address-level2" />
      <TextField label="State" value={v.state} onChange={set('state')} autoComplete="address-level1" />
      <TextField label="Pincode" inputMode="numeric" maxLength={6} value={v.pincode} onChange={set('pincode')} error={errors.pincode} autoComplete="postal-code" />
      <TextField label="Courier instructions (optional)" value={v.instructions} onChange={set('instructions')} />
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={v.isDefault} onChange={set('isDefault')} className="h-4 w-4 accent-tomato" /> Make this my default address</label>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" loading={busy}>{submitLabel}</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
