import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, Shapes, ReceiptText } from 'lucide-react';

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Produk', icon: Package },
  { to: '/admin/categories', label: 'Kategori', icon: Shapes },
  { to: '/admin/orders', label: 'Pesanan', icon: ReceiptText },
];

// Denser admin shell: sidebar on desktop, horizontal tabs on mobile.
export default function AdminLayout() {
  return (
    <div className="flex min-h-svh bg-cream">
      <aside className="hidden w-60 flex-col gap-2 border-r border-line bg-surface px-4 py-6 md:flex">
        <p className="px-3 font-serif text-xl font-semibold text-espresso">BakeHouse Admin</p>
        <nav aria-label="Admin" className="mt-6 flex flex-col gap-1">
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav aria-label="Admin mobile" className="flex gap-2 overflow-x-auto border-b border-line bg-surface px-4 py-3 md:hidden">
          {ADMIN_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
                  isActive ? 'bg-honey text-crust' : 'text-cocoa'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <main id="main" className="flex-1 px-4 py-8 md:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
