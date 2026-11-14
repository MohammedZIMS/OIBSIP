import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import TextField from '../ui/TextField.jsx';
import StatusBadge from './StatusBadge.jsx';
import { api } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { stockStatusOf } from '../../utils/status.js';

const REASONS = [
  { value: 'manual_restock', label: 'Restock (delivery received)' },
  { value: 'correction', label: 'Count correction' },
  { value: 'wastage', label: 'Wastage or spoilage' },
  { value: 'manual_adjustment', label: 'Other adjustment' },
];

/** Used from the admin dashboard, inventory list and ledger. `item` needs id, name, quantity, threshold. */
export default function StockAdjustModal({ item, onClose, onDone }) {
  const toast = useToast();
  const [mode, setMode] = useState('delta');
  const [value, setValue] = useState('');
  const [type, setType] = useState('manual_restock');
  const [note, setNote] = useState('');
  const [ref, setRef] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const n = Number(value);
  const valid = value !== '' && Number.isInteger(n) && (mode === 'set' ? n >= 0 : n !== 0);
  const after = !valid ? null : mode === 'set' ? n : item.quantity + n;
  const tooLow = after !== null && after < 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || tooLow) return setError(tooLow ? 'Stock cannot go below zero' : 'Enter a whole number');
    setBusy(true); setError('');
    try {
      await api.admin.adjust(item.id, { mode, value: n, type: mode === 'delta' && n < 0 && type === 'manual_restock' ? 'manual_adjustment' : type, note, referenceNo: ref });
      toast(`${item.name} updated`, { type: 'success', ms: 3000 });
      onDone?.(); onClose();
    } catch (x) { setError(x.message); } finally { setBusy(false); }
  };

  return (
    <Modal title={`Adjust stock: ${item.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="muted flex items-center gap-2 text-sm">Current: <strong className="tabular-nums">{item.quantity}</strong> (threshold {item.threshold}) <StatusBadge status={stockStatusOf(item)} /></p>
        <div role="group" aria-label="Adjustment mode" className="flex gap-2">
          {[['delta', 'Add or remove'], ['set', 'Set exact count']].map(([k, l]) => (
            <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)} className={`chip ${mode === k ? 'chip-on' : 'chip-off'}`}>{l}</button>
          ))}
        </div>
        <div>
          <TextField label={mode === 'set' ? 'New quantity' : 'Change (+ to add, - to remove)'} type="number" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} />
          {mode === 'delta' && <div className="mt-2 flex gap-2">{[5, 10, 20, 50].map((q) => <button key={q} type="button" className="chip chip-off" onClick={() => setValue(String(q))}>+{q}</button>)}</div>}
          {after !== null && <p className={`mt-2 text-sm ${tooLow ? 'text-tomato dark:text-tomato-soft' : 'muted'}`}>New quantity: <strong>{after}</strong></p>}
        </div>
        <div>
          <label htmlFor="reason" className="label">Reason</label>
          <select id="reason" className="input" value={type} onChange={(e) => setType(e.target.value)}>{REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select>
        </div>
        <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        <TextField label="PO or lot number (optional)" value={ref} onChange={(e) => setRef(e.target.value)} maxLength={60} />
        {error && <p role="alert" className="field-error">{error}</p>}
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy} disabled={!valid || tooLow}>Confirm and save</Button></div>
      </form>
    </Modal>
  );
}
