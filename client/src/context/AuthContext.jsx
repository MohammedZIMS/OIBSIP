import { api } from '../api/index.js';
import { makeAuthContext } from './makeAuthContext.jsx';

export const [AuthProvider, useAuth] = makeAuthContext('user', () => api.auth.me());
