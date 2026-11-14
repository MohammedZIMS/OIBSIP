import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../../../components/ui/Button.jsx';
import TextField from '../../../components/ui/TextField.jsx';
import { ErrorState, Spinner } from '../../../components/ui/States.jsx';
import { FormAlert } from '../../auth/AuthCard.jsx';
import { DataRecent } from './RecentAdjustments.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { useForm } from '../../../hooks/useForm.js';
import { api } from '../../../api/index.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { CATEGORIES } from '../../../utils/status.js';

const UNITS = ['unit', 'kg', 'g', 'l', 'ml'];
const rupees = (p) => (p === undefined ? '' : String(p / 100));

function Form({ item }) {
  const edit = Boolean(item);
  const nav = useNavigate();
  const toast = useToast();
  const f = useForm({ name: item?.name ?? '', category: item?.category ?? 'base', description: item?.description ?? '', price: rupees(item?.price), threshold: String(item?.threshold ?? 20), unit: item?.unit ?? 'unit', quantity: '0' });

  const validate = (v) => {
    const e = {};
    if (!v.name.trim()) e.name = 'Enter a name';
    if (v.price === '' || Number(v.price) < 0 || Number.isNaN(Number(v.price))) e.price = 'Enter a price of 0 or more';
    if (!Number.isInteger(Number(v.threshold)) || Number(v.threshold) < 0) e.threshold = 'Enter a whole number of 0 or more';
    if (!edit && (!Number.isInteger(Number(v.quantity)) || Number(v.quantity) < 0)) e.quantity = 'Enter a whole number of 0 or more';
    return e;
  };
  const submit = async (v) => {
    const body = { name: v.name.trim(), description: v.description.trim(), price: Math.round(Number(v.price) * 100), threshold: Number(v.threshold), unit: v.unit };
    if (edit) await api.admin.updateItem(item.id, body); else await api.admin.createItem({ ...body, category: v.category, quantity: Number(v.quantity) });
    toast(edit ? 'Changes saved' : 'Ingredient added', { type: 'success', ms: 3000 });
    nav('/admin/inventory');
  };
  const deactivate = async () => {
    if (!window.confirm(`Remove ${item.name} from the builder and menu? Existing orders are not affected.`)) return;
    try { await api.admin.deactivateItem(item.id); toast('Ingredient removed from the menu', { type: 'info', ms: 3000 }); nav('/admin/inventory'); } catch (e) { f.setFormError(e.message); }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form onSubmit={f.handle(validate, submit)} noValidate className="card space-y-4 p-6 lg:col-span-2">
        <FormAlert>{f.formError}</FormAlert>
        <TextField label="Name" {...f.bind('name')} />
        <div>
          <label className="label" htmlFor="cat">Category</label>
          <select id="cat" className="input" disabled={edit} {...f.bind('category')}>{CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label.replace(/s$/, '')}</option>)}</select>
          {edit && <p className="muted mt-1 text-sm">Category cannot change after creation.</p>}
        </div>
        <TextField label="Description (optional)" {...f.bind('description')} />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Price added (₹)" inputMode="decimal" {...f.bind('price')} />
          <TextField label="Low-stock threshold" inputMode="numeric" hint="Alert when stock drops below this." {...f.bind('threshold')} />
          <div><label className="label" htmlFor="unit">Unit</label><select id="unit" className="input" {...f.bind('unit')}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
        </div>
        {edit ? <p className="muted text-sm">Current stock is <strong>{item.quantity}</strong>. Change it with <em>Adjust</em> on the inventory list so the ledger records why.</p>
          : <TextField label="Opening stock" inputMode="numeric" {...f.bind('quantity')} />}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="flex gap-2"><Button type="submit" loading={f.busy}>{edit ? 'Save changes' : 'Add ingredient'}</Button><Button variant="ghost" to="/admin/inventory">Cancel</Button></div>
          {edit && <Button variant="danger" size="sm" onClick={deactivate}>Remove from menu</Button>}
        </div>
      </form>
      {edit && <DataRecent name={item.name} />}
    </div>
  );
}

export default function InventoryEditPage() {
  const { id } = useParams();
  const { data, error, loading, reload } = useAsync(() => (id ? api.admin.item(id) : Promise.resolve(null)), [id]);
  return (
    <div>
      <p className="mb-2 text-sm"><Link to="/admin/inventory" className="underline">← Inventory</Link></p>
      <h1 className="mb-6 text-3xl font-bold">{id ? 'Edit ingredient' : 'Add ingredient'}</h1>
      {loading ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : <Form item={data ?? undefined} />}
    </div>
  );
}
