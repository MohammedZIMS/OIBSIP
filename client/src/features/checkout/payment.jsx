import { useCallback, useState } from 'react';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import { API_MODE, ApiClientError } from '../../api/index.js';
import { formatPaise } from '../../utils/money.js';

const RZP_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve();
  const s = Object.assign(document.createElement('script'), { src: RZP_SRC, onload: resolve, onerror: () => reject(new ApiClientError(0, 'NETWORK', 'Could not load the payment window. Check your connection.')) });
  document.body.appendChild(s);
});

function MockRazorpay({ amount, onDone }) {
  return (
    <Modal title="Razorpay test checkout (demo)" onClose={() => onDone('cancel')}>
      <p className="muted text-sm">This is a simulated payment window for demo mode. In live mode the real Razorpay test checkout opens here.</p>
      <p className="my-4 text-center font-display text-3xl font-extrabold">{formatPaise(amount)}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" onClick={() => onDone('success')}>Success</Button>
        <Button className="flex-1" variant="outline" onClick={() => onDone('failure')}>Failure</Button>
      </div>
    </Modal>
  );
}

/** Returns [pay, modal]. pay(order, prefill) resolves with the Razorpay response, or rejects if cancelled or failed. */
export function usePayment() {
  const [mock, setMock] = useState(null);

  const pay = useCallback((order, prefill) => {
    if (API_MODE === 'mock') {
      return new Promise((resolve, reject) => setMock({
        amount: order.amount,
        done: (outcome) => {
          setMock(null);
          if (outcome === 'success') resolve({ razorpay_order_id: order.razorpayOrderId, razorpay_payment_id: `pay_mock${Date.now()}`, razorpay_signature: 'mock', outcome });
          else reject(new ApiClientError(0, outcome === 'failure' ? 'PAYMENT_FAILED' : 'PAYMENT_CANCELLED', outcome === 'failure' ? 'Payment failed. You have not been charged.' : 'Payment cancelled.'));
        },
      }));
    }
    return loadRazorpay().then(() => new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.razorpayOrderId,
        name: 'Forno & Farina', description: 'Pizza order', prefill, theme: { color: '#B80311' },
        handler: resolve,
        modal: { ondismiss: () => reject(new ApiClientError(0, 'PAYMENT_CANCELLED', 'Payment cancelled.')) },
      });
      rzp.on('payment.failed', (r) => reject(new ApiClientError(0, 'PAYMENT_FAILED', r.error?.description ?? 'Payment failed.')));
      rzp.open();
    }));
  }, []);

  return [pay, mock ? <MockRazorpay amount={mock.amount} onDone={mock.done} /> : null];
}
