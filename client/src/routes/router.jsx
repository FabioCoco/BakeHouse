import { createBrowserRouter } from 'react-router-dom';
import CustomerLayout from '../components/layout/CustomerLayout.jsx';
import AdminLayout from '../components/layout/AdminLayout.jsx';
import AdminRoute from './AdminRoute.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

// Pages are lazy-loaded so each route only downloads the code it needs.
// Catalog, cart, checkout and the remaining admin pages are added in their phases.
const lazyPage = (loader) => () => loader().then((module) => ({ Component: module.default }));

export const router = createBrowserRouter([
  {
    element: <CustomerLayout />,
    children: [
      { index: true, lazy: lazyPage(() => import('../pages/Home.jsx')) },
      { path: 'products', lazy: lazyPage(() => import('../pages/Catalog.jsx')) },
      { path: 'products/:slug', lazy: lazyPage(() => import('../pages/ProductDetail.jsx')) },
      { path: 'styleguide', lazy: lazyPage(() => import('../pages/Styleguide.jsx')) },
      { path: 'forbidden', lazy: lazyPage(() => import('../pages/Forbidden.jsx')) },
      { path: 'login', lazy: lazyPage(() => import('../pages/Login.jsx')) },
      { path: 'register', lazy: lazyPage(() => import('../pages/Register.jsx')) },
      {
        // Any signed-in customer or admin.
        element: <ProtectedRoute />,
        children: [
          { path: 'account', lazy: lazyPage(() => import('../pages/Account.jsx')) },
          { path: 'cart', lazy: lazyPage(() => import('../pages/Cart.jsx')) },
          { path: 'checkout', lazy: lazyPage(() => import('../pages/Checkout.jsx')) },
          { path: 'checkout/success/:id', lazy: lazyPage(() => import('../pages/CheckoutSuccess.jsx')) },
          { path: 'orders', lazy: lazyPage(() => import('../pages/Orders.jsx')) },
          { path: 'orders/:id', lazy: lazyPage(() => import('../pages/OrderDetail.jsx')) },
          { path: 'account/addresses', lazy: lazyPage(() => import('../pages/AccountAddresses.jsx')) },
        ],
      },
    ],
  },
  {
    // Signed-in admins only. Guests go to /login, customers go to /forbidden.
    path: 'admin',
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, lazy: lazyPage(() => import('../pages/admin/AdminDashboard.jsx')) },
          { path: 'products', lazy: lazyPage(() => import('../pages/admin/AdminProducts.jsx')) },
          { path: 'categories', lazy: lazyPage(() => import('../pages/admin/AdminCategories.jsx')) },
          { path: 'orders', lazy: lazyPage(() => import('../pages/admin/AdminOrders.jsx')) },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <CustomerLayout />,
    children: [{ path: '*', lazy: lazyPage(() => import('../pages/NotFound.jsx')) }],
  },
]);
