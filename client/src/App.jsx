import { RouterProvider } from 'react-router-dom';
import { makeRouter } from './app/router.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';

const router = makeRouter();

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
