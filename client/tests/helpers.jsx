import { render } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { routes } from '../src/app/router.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import { AdminAuthProvider } from '../src/context/AdminAuthContext.jsx';
import { CartProvider } from '../src/context/CartContext.jsx';

export function renderApp(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();
  const utils = render(
    <ToastProvider><AuthProvider><AdminAuthProvider><CartProvider><RouterProvider router={router} /></CartProvider></AdminAuthProvider></AuthProvider></ToastProvider>,
  );
  return { router, user, ...utils };
}
