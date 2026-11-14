import { createBrowserRouter, Navigate } from 'react-router-dom';
import CustomerLayout from '../components/layout/CustomerLayout.jsx';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import AdminLayout from '../components/layout/AdminLayout.jsx';
import { AdminGuard, PublicOnly, UserGuard } from './guards.jsx';
import ComingSoon from './ComingSoon.jsx';
import HomePage from '../features/home/HomePage.jsx';
import RegisterPage from '../features/auth/pages/RegisterPage.jsx';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage.jsx';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage.jsx';
import DashboardPage from '../features/menu/pages/DashboardPage.jsx';
import BuilderPage from '../features/builder/BuilderPage.jsx';
import CheckoutPage from '../features/checkout/CheckoutPage.jsx';
import OrdersPage from '../features/orders/OrdersPage.jsx';
import ProfilePage from '../features/profile/ProfilePage.jsx';
import AdminLoginPage from '../features/admin/auth/AdminLoginPage.jsx';
import AdminDashboardPage from '../features/admin/dashboard/AdminDashboardPage.jsx';
import InventoryPage from '../features/admin/inventory/InventoryPage.jsx';
import InventoryEditPage from '../features/admin/inventory/InventoryEditPage.jsx';
import AdminOrdersPage from '../features/admin/orders/AdminOrdersPage.jsx';
import AdminOrderDetailPage from '../features/admin/orders/AdminOrderDetailPage.jsx';
import LedgerAlertsPage from '../features/admin/ledger/LedgerAlertsPage.jsx';

export const routes = [
  // Public auth pages (no site header)
  { element: <AuthLayout />, children: [
    { element: <PublicOnly />, children: [
      { path: '/register', element: <RegisterPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ] },
    { path: '/verify-email', element: <VerifyEmailPage /> },
    { path: '/reset-password', element: <ResetPasswordPage /> },
  ] },

  // Customer site
  { element: <CustomerLayout />, children: [
    { path: '/', element: <HomePage /> },
    { path: '/builder', element: <BuilderPage /> },
    { element: <UserGuard />, children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/orders', element: <OrdersPage /> },
      { path: '/orders/:id', element: <OrdersPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ] },
    { path: '*', element: <ComingSoon title="That page" /> },
  ] },

  // Admin (separate login, never linked from the customer UI)
  { path: '/admin/login', element: <AdminLoginPage /> },
  { path: '/admin', element: <AdminGuard />, children: [
    { element: <AdminLayout />, children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'inventory/new', element: <InventoryEditPage /> },
      { path: 'inventory/:id/edit', element: <InventoryEditPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'orders/:id', element: <AdminOrderDetailPage /> },
      { path: 'ledger', element: <LedgerAlertsPage /> },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ] },
  ] },
];

export const makeRouter = () => createBrowserRouter(routes);
