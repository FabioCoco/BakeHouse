import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderService } from '../services/orderService.js';

// Sandbox and production Snap scripts. The flag switches between them, so the same build works in both.
const SANDBOX_SNAP_URL = 'https://app.sandbox.midtrans.com/snap/snap.js';
const PRODUCTION_SNAP_URL = 'https://app.midtrans.com/snap/snap.js';

const CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
const IS_PRODUCTION = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';

// The script loads once per page. Concurrent callers share the same promise.
let loadPromise = null;

export const loadSnap = () => {
  if (window.snap) return Promise.resolve(window.snap);
  if (!CLIENT_KEY) {
    return Promise.reject(new Error('Payments are not configured yet. Please contact the store.'));
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = IS_PRODUCTION ? PRODUCTION_SNAP_URL : SANDBOX_SNAP_URL;
      script.setAttribute('data-client-key', CLIENT_KEY);
      script.onload = () => resolve(window.snap);
      script.onerror = () => {
        // Allow a retry on the next call instead of caching the failure.
        loadPromise = null;
        script.remove();
        reject(new Error('Could not load the payment page. Check your connection and try again.'));
      };
      document.head.appendChild(script);
    });
  }
  return loadPromise;
};

// Opens the Midtrans popup for an order. Every outcome shows a toast and then opens the order page,
// where the status is synced again.
export default function useMidtransSnap() {
  const navigate = useNavigate();

  const pay = useCallback(
    async (snapToken, orderId) => {
      const snap = await loadSnap();

      // Ask the server for the live status. This matters locally, where the webhook cannot reach us.
      const syncStatus = () => orderService.syncPaymentStatus(orderId).catch(() => {});
      const openOrder = () => navigate(`/orders/${orderId}`, { replace: true });

      snap.pay(snapToken, {
        onSuccess: async () => {
          await syncStatus();
          toast.success('Payment successful. Thank you!');
          openOrder();
        },
        onPending: async () => {
          await syncStatus();
          toast('Payment is awaiting confirmation. We will let you know once it is received.');
          openOrder();
        },
        onError: async () => {
          await syncStatus();
          toast.error('Payment failed. You can try again from the order page.');
          openOrder();
        },
        onClose: async () => {
          await syncStatus();
          toast('Payment is not finished. Continue from the order page.');
          openOrder();
        },
      });
    },
    [navigate],
  );

  return { pay };
}
