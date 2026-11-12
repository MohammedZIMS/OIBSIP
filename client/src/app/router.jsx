import { createBrowserRouter } from 'react-router-dom';
import CustomerLayout from '../components/layout/CustomerLayout.jsx';
import HomePage from '../features/home/HomePage.jsx';
import ComingSoon from './ComingSoon.jsx';

const soon = (title) => <ComingSoon title={title} />;

export const router = createBrowserRouter([
  {
    element: <CustomerLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/register', element: soon('Register') },
      { path: '/verify-email', element: soon('Email verification') },
      { path: '/login', element: soon('Login') },
      { path: '/forgot-password', element: soon('Forgot password') },
      { path: '/reset-password', element: soon('Reset password') },
      { path: '/dashboard', element: soon('Dashboard') },
      { path: '/builder', element: soon('Pizza builder') },
      { path: '/checkout', element: soon('Checkout') },
      { path: '/orders', element: soon('Order tracking') },
      { path: '/profile', element: soon('Profile') },
      { path: '*', element: soon('That page') },
    ],
  },
]);
