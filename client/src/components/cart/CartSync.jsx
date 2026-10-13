import { useEffect } from 'react';
import { cartService } from '../../services/cartService.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useCartStore } from '../../store/useCartStore.js';

// Keeps the cart in step with the signed-in user. Loads it after login and clears it on logout.
// Renders nothing.
export default function CartSync() {
  const userId = useAuthStore((state) => state.user?._id);
  const setCart = useCartStore((state) => state.setCart);
  const setStatus = useCartStore((state) => state.setStatus);
  const resetCart = useCartStore((state) => state.resetCart);

  useEffect(() => {
    if (!userId) {
      resetCart();
      return undefined;
    }

    let active = true;
    setStatus('loading');
    cartService
      .get()
      .then((body) => {
        if (active) setCart(body.data);
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [userId, setCart, setStatus, resetCart]);

  return null;
}
