import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cartService } from '../services/cartService.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useCartStore } from '../store/useCartStore.js';
import { withQuantity, withoutItem } from '../utils/cartView.js';

// Ids of the latest request. Older responses are ignored so a slow reply cannot overwrite a newer cart.
let latestRequest = 0;

export default function useCart() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const setCart = useCartStore((state) => state.setCart);

  const requireLogin = () => {
    toast('Masuk dulu untuk menyimpan roti di keranjang.');
    navigate('/login', { state: { from: location.pathname + location.search } });
  };

  // Reloads the server cart. Used after an error so the UI shows the real state.
  const refresh = async () => {
    try {
      setCart((await cartService.get()).data);
    } catch {
      // The session check and the cart sync report failures. Nothing more to do here.
    }
  };

  const handleError = (err) => {
    const conflict = err.status === 409 ? err.errors?.[0] : undefined;
    if (conflict?.available !== undefined) {
      toast.error(
        conflict.available > 0
          ? `Stok ${conflict.name} tinggal ${conflict.available}.`
          : `${conflict.name} sudah habis.`,
      );
    } else {
      toast.error(err.message);
    }
    refresh();
  };

  const addToCart = async (product, quantity) => {
    if (!user) return requireLogin();

    const seq = ++latestRequest;
    try {
      const body = await cartService.addItem(product._id, quantity);
      if (seq === latestRequest) setCart(body.data);
      toast.success(`${product.name} ditambahkan ke keranjang.`);
    } catch (err) {
      handleError(err);
    }
  };

  // Optimistic: the new quantity shows at once. If the server rejects it, the previous cart comes back.
  const changeQuantity = async (productId, quantity) => {
    const previous = useCartStore.getState().cart;
    if (!previous) return;

    const seq = ++latestRequest;
    setCart(withQuantity(previous, productId, quantity));

    try {
      const body = await cartService.updateItem(productId, quantity);
      if (seq === latestRequest) setCart(body.data);
    } catch (err) {
      if (seq === latestRequest) setCart(previous);
      handleError(err);
    }
  };

  // Optimistic removal with the same rollback rule.
  const removeItem = async (productId) => {
    const previous = useCartStore.getState().cart;
    if (!previous) return;

    const seq = ++latestRequest;
    setCart(withoutItem(previous, productId));

    try {
      const body = await cartService.removeItem(productId);
      if (seq === latestRequest) setCart(body.data);
    } catch (err) {
      if (seq === latestRequest) setCart(previous);
      handleError(err);
    }
  };

  const clearCart = async () => {
    const seq = ++latestRequest;
    try {
      const body = await cartService.clear();
      if (seq === latestRequest) setCart(body.data);
    } catch (err) {
      handleError(err);
    }
  };

  return { addToCart, changeQuantity, removeItem, clearCart, refresh };
}
