import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { mock } from '../src/api/mock/index.js';

const dom = typeof window !== 'undefined'; // the live-API test runs in plain Node
if (dom) {
  // jsdom does not implement these
  window.scrollTo = () => {};
  Element.prototype.scrollIntoView = () => {};
  window.confirm = () => true;
  window.print = () => {};
}
beforeEach(() => { if (dom) { localStorage.clear(); sessionStorage.clear(); } mock.resetDemo(); });
afterEach(() => { if (dom) cleanup(); });
