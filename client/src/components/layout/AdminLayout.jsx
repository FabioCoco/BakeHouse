import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, LogOut, MessageSquare, Package, ReceiptText, Settings, Shapes } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService.js';
import { useAuthStore } from '../../store/useAuthStore.js';

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Shapes },
  { to: '/admin/orders', label: 'Orders', icon: ReceiptText },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

// Admin shell: sidebar on desktop, horizontal tabs on mobile. Both offer a way back to the storefront and a logout.
export default function AdminLayout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Clear the local session even if the request fails.
    }
    clearAuth();
    toast.success('You have signed out.');
    navigate('/');
  };

  return (
    <div className="flex min-h-svh bg-cream">
      <aside className="hidden w-60 flex-col border-r border-line bg-surface px-4 py-6 md:flex">
        <p className="px-3 font-serif text-xl font-semibold text-espresso">BakeHouse Admin</p>
        {user && <p className="px-3 pt-1 text-xs text-cocoa">{user.name}</p>}

        <nav aria-label="Admin" className="mt-6 flex flex-1 flex-col gap-1">
          {ADMIN_LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200 ${
                  isActive ? 'bg-honey text-crust' : 'text-cocoa hover:bg-sand/40 hover:text-espresso'
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-line pt-4">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cocoa transition duration-200 hover:bg-sand/40 hover:text-espresso"
          >
            <Home size={18} aria-hidden="true" />
            Back to store
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-berry transition duration-200 hover:bg-berry/10"
          >
            <LogOut size={18} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav aria-label="Admin mobile" className="flex items-center gap-2 overflow-x-auto border-b border-line bg-surface px-4 py-3 md:hidden">
          {ADMIN_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${isActive ? 'bg-honey text-crust' : 'text-cocoa'}`
              }
            >
              {label}
            </NavLink>
          ))}
          <NavLink to="/" className="ml-auto shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-cocoa">
            Home
          </NavLink>
          <button type="button" onClick={handleLogout} className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-berry">
            Sign out
          </button>
        </nav>
        <main id="main" className="flex-1 px-4 py-8 md:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
