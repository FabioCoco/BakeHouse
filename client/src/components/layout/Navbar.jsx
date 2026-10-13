import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button.jsx';
import Container from './Container.jsx';
import { authService } from '../../services/authService.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { useCartStore } from '../../store/useCartStore.js';

const NAV_LINKS = [
  { to: '/products', label: 'Menu' },
  { to: '/#cara-pesan', label: 'Cara Pesan' },
];

// Placeholder navbar. Transparent over the hero and cream after scrolling, styled in phase 2.
export default function Navbar() {
  const navigate = useNavigate();
  const setMobileNavOpen = useUIStore((state) => state.setMobileNavOpen);
  const openCart = useCartStore((state) => state.openCart);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Clear the local session even if the request fails.
    }
    clearAuth();
    toast.success('Kamu sudah keluar.');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <Container as="nav" aria-label="Utama" className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Buka menu"
            className="rounded-full p-2 text-espresso transition hover:bg-sand/40 md:hidden"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          <Link to="/" className="font-serif text-2xl font-semibold tracking-tight text-espresso">
            BakeHouse
          </Link>
        </div>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className="text-sm font-medium text-cocoa transition duration-200 hover:text-espresso"
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="hidden rounded-full px-3 py-2 text-sm font-medium text-cocoa hover:text-espresso sm:block">
                  Admin
                </Link>
              )}
              <Link to="/account" className="hidden rounded-full px-3 py-2 text-sm font-medium text-cocoa hover:text-espresso sm:block">
                Akun
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Keluar
              </Button>
            </>
          ) : (
            <Button as={Link} to="/login" variant="outline" size="sm">
              Masuk
            </Button>
          )}
          <button
            type="button"
            onClick={openCart}
            aria-label="Buka keranjang"
            className="rounded-full p-2 text-espresso transition hover:bg-sand/40"
          >
            <ShoppingBag size={22} aria-hidden="true" />
          </button>
        </div>
      </Container>
    </header>
  );
}
