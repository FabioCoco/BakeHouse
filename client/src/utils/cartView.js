// Client-side copy of the cart totals. Used only for optimistic updates. The server response replaces it when it arrives.
// Keep the rules in line with server/src/services/cartService.js (toCartView).
export const buildCartView = (lines) => {
  let subtotal = 0;
  let itemCount = 0;
  let hasIssues = false;

  const items = lines.map((line) => {
    const { product, quantity } = line;
    const issues = [];

    if (!product || !product.isActive) {
      issues.push('unavailable');
    } else if (product.stock < quantity) {
      issues.push('insufficient_stock');
    }

    if (issues.length) hasIssues = true;

    const lineTotal = product && product.isActive ? product.price * quantity : 0;
    subtotal += lineTotal;
    itemCount += quantity;

    return { product, quantity, lineTotal, issues };
  });

  return { items, itemCount, subtotal, hasIssues };
};

export const withQuantity = (cart, productId, quantity) =>
  buildCartView(cart.items.map((line) => (line.product?._id === productId ? { ...line, quantity } : line)));

export const withoutItem = (cart, productId) =>
  buildCartView(cart.items.filter((line) => line.product?._id !== productId));
