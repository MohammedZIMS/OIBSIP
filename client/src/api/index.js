// VITE_API_MODE=mock (default): the whole app runs in the browser with demo data, no backend needed.
// VITE_API_MODE=live: talks to the Express API (auth and catalogue exist today; the rest arrives in later backend phases).
import { live } from './live.js';
import { mock } from './mock/index.js';

export const API_MODE = import.meta.env?.VITE_API_MODE === 'live' ? 'live' : 'mock';
export const api = API_MODE === 'live' ? live : mock;
export { ApiClientError } from './client.js';
