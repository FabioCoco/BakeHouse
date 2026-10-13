// Bank details come back only from checkout. They are kept per order in sessionStorage so the success page
// still shows them after a refresh. This is a per-browser convenience, not the source of truth.
const keyFor = (orderId) => `bakehouse:payment:${orderId}`;

export const savePayment = (orderId, payment) => {
  try {
    sessionStorage.setItem(keyFor(orderId), JSON.stringify(payment));
  } catch {
    // Storage can be blocked (private mode). The success page then shows a fallback message.
  }
};

export const loadPayment = (orderId) => {
  try {
    const raw = sessionStorage.getItem(keyFor(orderId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
