import { useId } from 'react';
import Icon from './Icon.jsx';

export default function TextField({ label, error, hint, className = '', as: Tag = 'input', ...props }) {
  const id = useId();
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <Tag id={id} className={`input ${error ? 'input-error' : ''}`} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} {...props} />
      {hint && !error && <p id={`${id}-h`} className="muted mt-1 text-sm">{hint}</p>}
      {error && <p id={`${id}-e`} className="field-error"><Icon name="error" className="text-base" />{error}</p>}
    </div>
  );
}
