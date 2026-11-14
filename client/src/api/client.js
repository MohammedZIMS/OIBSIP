// Small fetch wrapper: JSON in/out, bearer token per role, uniform errors.
export class ApiClientError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
  /** { fieldName: message } for forms, from the server's `details` array. */
  get fieldErrors() {
    return Object.fromEntries((this.details ?? []).filter((d) => d.path).map((d) => [d.path, d.message]));
  }
}

let base = import.meta.env?.VITE_API_URL || '/api';
export const setApiBase = (b) => { base = b; }; // used by tests that start a real server on a random port
export const TOKEN_KEYS = { user: 'ff_token', admin: 'ff_admin_token' };
const hasLS = () => typeof localStorage !== 'undefined';
export const getToken = (role) => (hasLS() ? localStorage.getItem(TOKEN_KEYS[role]) : null);
export const setToken = (role, t) => { if (hasLS()) (t ? localStorage.setItem(TOKEN_KEYS[role], t) : localStorage.removeItem(TOKEN_KEYS[role])); };

export async function http(method, path, { body, query, as } = {}) {
  const qs = query ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== null))}` : '';
  const token = as ? getToken(as) : null;
  let res;
  try {
    res = await fetch(`${base}${path}${qs}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError(0, 'NETWORK', 'Cannot reach the server. Check your connection and that the API is running.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = json.error ?? {};
    if (res.status === 401 && token && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ff:unauthorized', { detail: as }));
    throw new ApiClientError(res.status, e.code ?? 'ERROR', e.message ?? 'Something went wrong', e.details);
  }
  return json;
}
