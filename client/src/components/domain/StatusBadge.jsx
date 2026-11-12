import Icon from "../ui/Icon.jsx";
import { STOCK_STATUS } from "../../utils/status.js";

export default function StatusBadge({ status = "ok" }) {
  const s = STOCK_STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      <Icon name={s.icon} className="text-sm" />
      {s.label}
    </span>
  );
}
