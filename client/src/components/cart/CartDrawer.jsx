import { Link } from 'react-router-dom';
import { AlertTriangle, ShoppingBag } from 'lucide-react';
import CartItemRow from './CartItemRow.jsx';
import Button from '../ui/Button.jsx';
import Drawer from '../ui/Drawer.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import useCart from '../../hooks/useCart.js';
import { useCartStore } from '../../store/useCartStore.js';
import { formatRupiah } from '../../utils/formatRupiah.js';

// Slide-over cart. It shows the same server data as the /cart page.
export default function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const cart = useCartStore((state) => state.cart);
  const status = useCartStore((state) => state.status);
  const { changeQuantity, removeItem, refresh } = useCart();

  const footer = cart && cart.items.length > 0 && (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <span className="text-cocoa">Subtotal</span>
        <span className="font-serif text-2xl text-espresso">{formatRupiah(cart.subtotal)}</span>
      </div>
      <p className="text-xs text-cocoa">Ongkos kirim dan total dihitung saat checkout.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button as={Link} to="/cart" variant="outline" className="flex-1" onClick={closeCart}>
          Lihat Keranjang
        </Button>
        {cart.hasIssues ? (
          <Button disabled className="flex-1">
            Perbaiki keranjang dulu
          </Button>
        ) : (
          <Button as={Link} to="/checkout" onClick={closeCart} className="flex-1">
            Lanjut ke Checkout
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Drawer open={isOpen} onClose={closeCart} title="Keranjang" footer={footer}>
      {status === 'loading' && !cart && (
        <div className="flex flex-col gap-4" aria-busy="true">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-cocoa">Keranjang belum bisa dimuat.</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            Coba lagi
          </Button>
        </div>
      )}

      {cart && cart.items.length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title="Keranjangmu masih kosong"
          description="Pilih roti favoritmu dari menu kami."
          action={
            <Button as={Link} to="/products" variant="outline" onClick={closeCart}>
              Lihat Menu
            </Button>
          }
        />
      )}

      {cart && cart.items.length > 0 && (
        <>
          {cart.hasIssues && (
            <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-berry/10 p-3 text-sm text-berry">
              <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              Ada roti yang perlu diperbarui sebelum checkout.
            </p>
          )}
          <ul className="divide-y divide-line">
            {cart.items.map((line, index) => (
              <CartItemRow
                key={line.product?._id ?? `missing-${index}`}
                line={line}
                onQuantityChange={changeQuantity}
                onRemove={removeItem}
              />
            ))}
          </ul>
        </>
      )}
    </Drawer>
  );
}
