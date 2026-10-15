import { Link } from 'react-router-dom';
import Container from './Container.jsx';
import { SHOP } from '../../config/shop.js';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-cream">
      <Container className="grid gap-10 py-14 text-sm text-cocoa sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <p className="font-serif text-2xl text-espresso">{SHOP.name}</p>
          <p className="max-w-xs">Artisan bread baked every morning and delivered across Indonesia.</p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="eyebrow">Address</h2>
          {SHOP.address.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="eyebrow">Opening hours</h2>
          {SHOP.hours.map((item) => (
            <p key={item.days} className="flex justify-between gap-4">
              <span>{item.days}</span>
              <span className="font-medium text-espresso">{item.time}</span>
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="eyebrow">Payment</h2>
          <p>{SHOP.paymentNote}</p>
          <nav aria-label="Footer" className="mt-2 flex flex-col gap-2">
            <Link to="/products" className="w-fit transition hover:text-espresso">
              Menu
            </Link>
            <Link to="/#cara-pesan" className="w-fit transition hover:text-espresso">
              How to order
            </Link>
          </nav>
        </div>
      </Container>

      <div className="border-t border-line">
        <Container className="py-6 text-xs text-cocoa">
          © {new Date().getFullYear()} {SHOP.name}. All rights reserved.
        </Container>
      </div>
    </footer>
  );
}
