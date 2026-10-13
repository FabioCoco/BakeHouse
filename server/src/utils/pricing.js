// Discount rules in one place. The server decides with its own clock, so a client cannot keep a promo alive.

// A discount applies when it is set, has started (or has no start), and has not ended (or has no end).
export const isSaleActive = (product, now = new Date()) => {
  const percent = product.discountPercent ?? 0;
  if (percent <= 0) return false;
  if (product.discountStartsAt && new Date(product.discountStartsAt) > now) return false;
  if (product.discountEndsAt && new Date(product.discountEndsAt) <= now) return false;
  return true;
};

// Whole rupiah. Rounds to the nearest rupiah so the result is always an integer.
export const effectivePriceOf = (product, now = new Date()) =>
  isSaleActive(product, now) ? Math.round((product.price * (100 - product.discountPercent)) / 100) : product.price;

// Mongo filter for "on sale right now". Missing and null dates count as open-ended.
export const onSaleFilter = (now = new Date()) => ({
  discountPercent: { $gt: 0 },
  $and: [
    { $or: [{ discountStartsAt: null }, { discountStartsAt: { $lte: now } }] },
    { $or: [{ discountEndsAt: null }, { discountEndsAt: { $gt: now } }] },
  ],
});
