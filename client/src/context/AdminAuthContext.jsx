import { api } from '../api/index.js';
import { makeAuthContext } from './makeAuthContext.jsx';

export const [AdminAuthProvider, useAdminAuth] = makeAuthContext('admin', () => api.admin.me());
