import { useCallback, useState } from 'react';

/** Tiny form helper: values, per-field errors (from validation or the server), and a busy flag. */
export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const bind = (k, type = 'text') => ({
    name: k,
    value: type === 'checkbox' ? undefined : values[k],
    checked: type === 'checkbox' ? Boolean(values[k]) : undefined,
    error: errors[k],
    onChange: (e) => { const v = type === 'checkbox' ? e.target.checked : e.target.value; setValues((s) => ({ ...s, [k]: v })); if (errors[k]) setErrors((s) => ({ ...s, [k]: undefined })); },
  });
  /** validate(values) returns { field: message }. submit(values) is awaited; ApiClientError details map back to fields. */
  const handle = useCallback((validate, submit) => async (e) => {
    e?.preventDefault();
    const er = validate?.(values) ?? {};
    setErrors(er); setFormError('');
    if (Object.keys(er).length) return;
    setBusy(true);
    try { await submit(values); } catch (x) {
      const fe = x.fieldErrors ?? {};
      setErrors(fe);
      if (!Object.keys(fe).length || x.status >= 500 || x.status === 0 || x.status === 401 || x.status === 403) setFormError(x.message);
    } finally { setBusy(false); }
  }, [values]);
  return { values, setValues, errors, setErrors, busy, formError, setFormError, bind, handle };
}
