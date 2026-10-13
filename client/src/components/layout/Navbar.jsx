import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button.jsx';
import Drawer from '../ui/Drawer.jsx';
import Container from './Container.jsx';
import { authService } from '../../services/authService.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { useCartStore } from '../../store/useCartStore.js';

const NAV_LINKS = [
  { to: '/products', label: 'Menu' },
  { to: '/#cara-pesan', label: 'Cara Pesan' },
];

// Over the home hero the bar is transparent. It turns cream once the page scrolls 24px, and on every other page.
export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const setMobileNavOpen = useUIStore((state) => state.setMobileNavOpen);
  const isMobileNavOpen = useUIStore((state) => state.isMobileNavOpen);
  const openCart = useCartStore((state) => state.openCart);
  const itemCount = useCartStore((state) => state.cart?.itemCount ?? 0);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const overHero = pathname === '/' && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Clear the local session even if the request fails.
    }
    clearAuth();
    setMobileNavOpen(false);
    toast.success('Kamu sudah keluar.');
    navigate('/');
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  // The drawer sits outside the header. The header's backdrop-blur would otherwise trap its fixed positioning.
  return (
    <>
    <header
      className={`sticky top-0 z-40 transition duration-300 ${
        overHero ? 'border-b border-transparent bg-transparent' : 'border-b border-line bg-cream/90 backdrop-blur'
      }`}
    >
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
              <NavLink to={link.to} className="text-sm font-medium text-cocoa transition duration-200 hover:text-espresso">
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
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:inline-flex">
                Keluar
              </Button>
            </>
          ) : (
            <Button as={Link} to="/login" variant="outline" size="sm" className="hidden sm:inline-flex">
              Masuk
            </Button>
          )}
          <button
            type="button"
            onClick={openCart}
            aria-label={itemCount > 0 ? `Buka keranjang, ${itemCount} roti` : 'Buka keranjang'}
            className="relative rounded-full p-2 text-espresso transition hover:bg-sand/40"
          >
            <ShoppingBag size={22} aria-hidden="true" />
            {itemCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-crust px-1 text-[11px] font-semibold text-surface"
              >
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </Container>
    </header>

      <Drawer open={isMobileNavOpen} onClose={closeMobileNav} title="Menu" width="max-w-xs">
        <nav aria-label="Menu mobile" className="flex flex-col gap-1">
          <NavLink to="/" end onClick={closeMobileNav} className="rounded-xl px-3 py-3 text-base font-medium hover:bg-sand/40">
            Beranda
          </NavLink>
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={closeMobileNav} className="rounded-xl px-3 py-3 text-base font-medium hover:bg-sand/40">
              {link.label}
            </NavLink>
          ))}
          <div className="my-3 border-t border-line" />
          {user ? (
            <>
              {user.role === 'admin' && (
                <NavLink to="/admin" onClick={closeMobileNav} className="rounded-xl px-3 py-3 text-base font-medium hover:bg-sand/40">
                  Admin
                </NavLink>
              )}
              <NavLink to="/account" onClick={closeMobileNav} className="rounded-xl px-3 py-3 text-base font-medium hover:bg-sand/40">
                Akun
              </NavLink>
              <button type="button" onClick={handleLogout} className="rounded-xl px-3 py-3 text-left text-base font-medium text-berry hover:bg-berry/10">
                Keluar
              </button>
            </>
          ) : (
            <NavLink to="/login" onClick={closeMobileNav} className="rounded-xl px-3 py-3 text-base font-medium hover:bg-sand/40">
              Masuk
            </NavLink>
          )}
        </nav>
      </Drawer>
    </>
  );
}
