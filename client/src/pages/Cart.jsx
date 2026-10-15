import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import Container from '../components/layout/Container.jsx';
import CartItemRow from '../components/cart/CartItemRow.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import useCart from '../hooks/useCart.js';
import { useCartStore } from '../store/useCartStore.js';
import { formatRupiah } from '../utils/formatRupiah.js';

export default function Cart() {
  const cart = useCartStore((state) => state.cart);
  const status = useCartStore((state) => state.status);
  const { changeQuantity, removeItem, clearCart, refresh } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    document.title = 'Cart · BakeHouse';
  }, []);

  const handleClear = async () => {
    setClearing(true);
    await clearCart();
    setClearing(false);
    setConfirmClear(false);
    toast.success('Cart cleared.');
  };

  if (status === 'loading' && !cart) {
    return (
      <Container className="py-12" aria-busy="true">
        <Skeleton className="mb-8 h-12 w-1/3" />
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Container>
    );
  }

  if (status === 'error' && !cart) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Cart could not be loaded"
          description="Check your connection and try again."
          action={
            <Button variant="outline" onClick={refresh}>
              Try again
            </Button>
          }
        />
      </Container>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <Container className="flex flex-col gap-10 py-12 md:py-16">
      <header className="flex flex-col gap-2">
        <p className="eyebrow">Belanja</p>
        <h1 className="text-5xl">Shopping Cart</h1>
      </header>

      {isEmpty ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Pick your favorite bread from our menu."
          action={
            <Button as={Link} to="/products" variant="outline">
              View menu
            </Button>
          }
        />
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
          <Card className="px-6 md:px-8">
            {cart.hasIssues && (
              <p role="alert" className="mt-6 flex items-start gap-2 rounded-xl bg-berry/10 p-3 text-sm text-berry">
                <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                Some loaves need updating before checkout.
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
            <div className="flex justify-end border-t border-line py-4">
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-sm font-medium text-berry underline-offset-4 hover:underline"
              >
                Clear cart
              </button>
            </div>
          </Card>

          <Card className="flex flex-col gap-5 p-6 lg:sticky lg:top-24">
            <h2 className="text-2xl">Summary</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-cocoa">Total loaves</dt>
                <dd className="font-medium">{cart.itemCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cocoa">Subtotal</dt>
                <dd className="font-serif text-xl text-espresso">{formatRupiah(cart.subtotal)}</dd>
              </div>
            </dl>
            <p className="text-xs text-cocoa">Shipping and total are calculated at checkout.</p>
            {cart.hasIssues ? (
              <Button disabled size="lg" className="w-full">
                Fix your cart first
              </Button>
            ) : (
              <Button as={Link} to="/checkout" size="lg" className="w-full">
                Continue to Checkout
              </Button>
            )}
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClear}
        title="Clear cart?"
        description="All loaves in your cart will be removed."
        confirmLabel="Ya, kosongkan"
        danger
        loading={clearing}
      />
    </Container>
  );
}
