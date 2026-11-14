// Real backend adapter. Endpoints marked (planned) are defined in docs/TRD.md and arrive in later backend phases;
// until then those calls return 404 and the UI shows an error.
import { http } from './client.js';

const norm = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? { ...x, id: x.id ?? x._id } : x);
const list = (r) => ({ items: (r.data ?? []).map(norm), meta: r.meta });
const data = async (p) => norm((await p).data);

export const live = {
  mode: 'live',
  auth: {
    register: (b) => http('POST', '/auth/register', { body: b }),
    login: async (b) => (await http('POST', '/auth/login', { body: b })).data,
    verifyEmail: async (token) => (await http('GET', '/auth/verify-email', { query: { token } })).data,
    verifyCode: async (b) => (await http('POST', '/auth/verify-code', { body: b })).data,
    resend: (email) => http('POST', '/auth/resend-verification', { body: { email } }),
    forgot: (email) => http('POST', '/auth/forgot-password', { body: { email } }),
    validateReset: async (token) => (await http('GET', '/auth/reset-token/validate', { query: { token } })).data,
    reset: (b) => http('POST', '/auth/reset-password', { body: b }),
    me: async () => (await http('GET', '/auth/me', { as: 'user' })).data.user,
    changePassword: async (b) => (await http('POST', '/auth/change-password', { body: b, as: 'user' })).data,
  },
  catalogue: {
    pizzas: async (q) => (await http('GET', '/pizzas', { query: q })).data.map(norm),
    ingredients: async (category) => (await http('GET', '/ingredients', { query: { category, limit: 100 } })).data.map(norm),
  },
  profile: {
    update: async (b) => (await http('PATCH', '/users/me', { body: b, as: 'user' })).data.user, // (planned)
    addresses: async () => (await http('GET', '/users/me/addresses', { as: 'user' })).data.map(norm), // (planned)
    addAddress: (b) => data(http('POST', '/users/me/addresses', { body: b, as: 'user' })),
    updateAddress: (id, b) => data(http('PATCH', `/users/me/addresses/${id}`, { body: b, as: 'user' })),
    removeAddress: (id) => http('DELETE', `/users/me/addresses/${id}`, { as: 'user' }),
  },
  orders: {
    create: async (b) => (await http('POST', '/orders', { body: b, as: 'user' })).data, // (planned)
    verifyPayment: async (b) => norm((await http('POST', '/payments/verify', { body: b, as: 'user' })).data.order),
    mine: async () => (await http('GET', '/orders/mine', { as: 'user' })).data.map(norm),
    active: async () => (await http('GET', '/orders/active', { as: 'user' })).data.map(norm),
    get: (id) => data(http('GET', `/orders/${id}`, { as: 'user' })),
  },
  admin: {
    login: async (b) => (await http('POST', '/admin/auth/login', { body: b })).data,
    me: async () => (await http('GET', '/admin/me', { as: 'admin' })).data.admin,
    summary: async () => (await http('GET', '/admin/dashboard/summary', { as: 'admin' })).data, // (planned)
    inventory: async (q) => (await http('GET', '/admin/inventory', { query: q, as: 'admin' })).data.map(norm), // (planned)
    item: (id) => data(http('GET', `/admin/inventory/${id}`, { as: 'admin' })),
    createItem: (b) => data(http('POST', '/admin/inventory', { body: b, as: 'admin' })),
    updateItem: (id, b) => data(http('PUT', `/admin/inventory/${id}`, { body: b, as: 'admin' })),
    deactivateItem: (id) => http('DELETE', `/admin/inventory/${id}`, { as: 'admin' }),
    adjust: async (id, b) => (await http('PATCH', `/admin/inventory/${id}`, { body: b, as: 'admin' })).data,
    ledger: async (q) => list(await http('GET', '/admin/ledger', { query: q, as: 'admin' })),
    alerts: async () => (await http('GET', '/admin/alerts', { as: 'admin' })).data,
    runAudit: async () => (await http('POST', '/admin/alerts/run', { as: 'admin' })).data,
    orders: async (q) => list(await http('GET', '/admin/orders', { query: q, as: 'admin' })),
    order: (id) => data(http('GET', `/admin/orders/${id}`, { as: 'admin' })),
    advance: async (id, status) => norm((await http('PATCH', `/admin/orders/${id}/status`, { body: { status }, as: 'admin' })).data),
  },
};
