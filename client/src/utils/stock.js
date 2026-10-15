// Every product shows its real stock. "Sold out" at zero, and the badge turns golden at 5 or fewer.
export const getStockState = (stock) => {
  if (stock <= 0) return { label: 'Sold out', tone: 'berry' };
  if (stock <= 5) return { label: `${stock} left`, tone: 'golden' };
  return { label: `${stock} left`, tone: 'sage' };
};
