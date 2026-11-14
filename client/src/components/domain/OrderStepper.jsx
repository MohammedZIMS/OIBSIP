import Icon from '../ui/Icon.jsx';
import { ORDER_STEPS, stepIndex } from '../../utils/status.js';
import { formatTime } from '../../utils/dates.js';

/** Three-stage tracker. Pass `status` (real order) or `current` (index, for demos). `history` adds timestamps. */
export default function OrderStepper({ status, current, history = [], dark = false }) {
  const idx = current ?? stepIndex(status);
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {ORDER_STEPS.map((s, i) => {
        const state = i < idx || (i === idx && idx === ORDER_STEPS.length - 1) ? 'done' : i === idx ? 'current' : 'next';
        const at = history.find((h) => h.status === s.key)?.at;
        return (
          <li key={s.key} aria-current={state === 'current' ? 'step' : undefined}
            className={`flex items-center gap-3 rounded-md border-2 p-4 ${state === 'current' ? (dark ? 'border-cheese bg-pan-raised' : 'border-onion bg-white') : dark ? 'border-white/15' : 'border-line'}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${state === 'done' ? 'bg-basil text-white' : state === 'current' ? 'bg-cheese text-pan' : 'border border-toast text-toast dark:border-ink-dark dark:text-ink-dark'}`}>
              <Icon name={state === 'done' ? 'check' : s.icon} />
            </span>
            <span>
              <span className="block font-semibold">{s.label}</span>
              <span className="muted block text-sm">{state === 'done' ? `Done${at ? ` · ${formatTime(at)}` : ''}` : state === 'current' ? `Happening now${at ? ` · since ${formatTime(at)}` : ''}` : 'Up next'}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
