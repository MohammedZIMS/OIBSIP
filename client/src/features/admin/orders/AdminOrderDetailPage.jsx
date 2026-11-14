import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../../../components/ui/Button.jsx';
import Icon from '../../../components/ui/Icon.jsx';
import OrderStepper from '../../../components/domain/OrderStepper.jsx';
import { OrderBadge } from '../../../components/domain/StatusBadge.jsx';
import { ErrorState, Spinner } from '../../../components/ui/States.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { usePolling } from '../../../hooks/usePolling.js';
import { api } from '../../../api/index.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatPaise } from '../../../utils/money.js';
import { formatDateTime } from '../../../utils/dates.js';
import { NEXT_ACTION_LABEL, NEXT_STATUS, ORDER_STATUS_META } from '../../../utils/status.js';

const Section = ({ title, children }) => <section className="card p-5"><h2 className="mb-3 text-lg font-bold">{title}</h2>{children}</section>;

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { data: o, error, loading, reload } = useAsync(() => api.admin.order(id), [id]);
  usePolling(() => reload(true), 5000);

  const advance = async () => {
    setBusy(true);
    try { await api.admin.advance(o.id, NEXT_STATUS[o.status]); await reload(true); toast('Status updated', { type: 'success', ms: 2500 }); } catch (e) { toast(e.message, { type: 'error' }); reload(true); } finally { setBusy(false); }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return (
    <div className="space-y-6">
      <p className="text-sm print:hidden"><Link to="/admin/orders" className="underline">← All orders</Link></p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="font-display text-3xl font-bold">Order #{o.orderNumber}</h1><p className="muted mt-1">Placed {formatDateTime(o.createdAt)}</p></div>
        <div className="flex flex-wrap items-center gap-2 print:hidden"><OrderBadge status={o.status} />{NEXT_STATUS[o.status] && <Button loading={busy} onClick={advance}>{NEXT_ACTION_LABEL[o.status]}<Icon name="arrow_forward" /></Button>}<Button variant="outline" onClick={() => window.print()}><Icon name="print" />Print ticket</Button></div>
      </div>
      {o.needsReview && <p role="alert" className="flex items-start gap-2 rounded-md border-2 border-tomato bg-tomato/15 p-3 text-sm"><Icon name="flag" /><span><strong>Needs review.</strong> {o.reviewReason ?? 'Stock ran short after payment was taken. Check the items below and contact the customer.'}</span></p>}
      <OrderStepper status={o.status} history={o.statusHistory} dark />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Items and kitchen spec">
            <ul className="divide-y divide-white/10">
              {o.items.map((i, k) => <li key={k} className="py-3"><div className="flex justify-between gap-4"><p className="font-semibold">{i.qty}× {i.name}</p><p className="tabular-nums">{formatPaise(i.unitPrice * i.qty)}</p></div><p className="muted mt-1 text-sm">{i.components.map((c) => `${c.name} (${c.category === 'veggie' ? 'vegetable' : c.category})`).join(' · ')}</p></li>)}
            </ul>
            {(o.notes || o.dropoffInstructions) && <div className="mt-3 rounded-md bg-cheese/15 p-3 text-sm">{o.notes && <p><strong>Kitchen and allergy notes:</strong> {o.notes}</p>}{o.dropoffInstructions && <p><strong>Drop-off:</strong> {o.dropoffInstructions}</p>}</div>}
          </Section>
          <Section title="Status history">
            <ol className="space-y-2 text-sm">{o.statusHistory.map((h, k) => <li key={k} className="flex justify-between gap-3"><span>{ORDER_STATUS_META[h.status]?.label ?? h.status}{h.by ? ` · by ${h.by}` : ''}</span><span className="muted">{formatDateTime(h.at)}</span></li>)}</ol>
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Customer and delivery">
            <p className="font-semibold">{o.customer?.name ?? 'Customer'}</p>
            {o.customer?.email && <p className="muted text-sm">{o.customer.email}</p>}
            {o.phone && <p className="mt-1 text-sm"><a className="underline" href={`tel:${o.phone}`}>{o.phone}</a></p>}
            {o.address && <p className="mt-3 text-sm">{[o.address.line1, o.address.line2, o.address.city, o.address.state, o.address.pincode].filter(Boolean).join(', ')}</p>}
          </Section>
          <Section title="Payment">
            <dl className="text-sm">{[['Subtotal', o.subtotal], ['Packaging', o.packagingFee], ['Delivery', o.deliveryFee], ['Taxes', o.tax]].map(([l, v]) => <div key={l} className="flex justify-between py-0.5"><dt className="muted">{l}</dt><dd className="tabular-nums">{formatPaise(v)}</dd></div>)}<div className="mt-1 flex justify-between border-t border-white/10 pt-2 font-bold"><dt>Total</dt><dd className="tabular-nums">{formatPaise(o.total)}</dd></div></dl>
            <p className="muted mt-3 text-sm">{o.paidAt ? `Paid ${formatDateTime(o.paidAt)} via Razorpay` : 'Not paid'}</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
