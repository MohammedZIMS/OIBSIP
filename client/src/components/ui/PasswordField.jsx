import { useId, useState } from 'react';
import Icon from './Icon.jsx';
import { checkPassword, strengthLabel } from '../../utils/passwordRules.js';

/** Password input with show/hide toggle. `showRules` adds a live checklist and strength label. */
export default function PasswordField({ label = 'Password', error, showRules = false, value = '', className = '', ...props }) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} value={value} className={`input pr-12 ${error ? 'input-error' : ''}`} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-e` : undefined} {...props} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-muted hover:text-pan dark:text-ink-dark dark:hover:text-parchment">
          <Icon name={show ? 'visibility_off' : 'visibility'} />
        </button>
      </div>
      {error && <p id={`${id}-e`} className="field-error"><Icon name="error" className="text-base" />{error}</p>}
      {showRules && (
        <div className="mt-2">
          <p className="muted text-sm">Strength: <strong>{strengthLabel(value)}</strong></p>
          <ul className="mt-1 grid gap-x-4 gap-y-0.5 text-sm sm:grid-cols-2">
            {checkPassword(value).map((r) => (
              <li key={r.id} className={`flex items-center gap-1.5 ${r.ok ? 'text-basil dark:text-basil-soft' : 'muted'}`}>
                <Icon name={r.ok ? 'check_circle' : 'radio_button_unchecked'} className="text-base" />
                {r.label}<span className="sr-only">{r.ok ? ' (done)' : ' (needed)'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
