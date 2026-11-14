import Icon from '../ui/Icon.jsx';
import { ORDER_STATUS_META, STOCK_STATUS } from '../../utils/status.js';

const Pill = ({ meta }) => (
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
    <Icon name={meta.icon} className="text-sm" />{meta.label}
  </span>
);

/** Stock state badge (default) or order state badge (kind="order"). Always icon + text. */
export default function StatusBadge({ status = 'ok', kind = 'stock' }) {
  return <Pill meta={(kind === 'order' ? ORDER_STATUS_META : STOCK_STATUS)[status]} />;
}
export const OrderBadge = ({ status }) => <StatusBadge kind="order" status={status} />;
