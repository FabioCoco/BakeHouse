// Stock label rules: "In stock", "N left" when 5 or fewer remain, "Sold out" at zero.
export const getStockState = (stock) => {
  if (stock <= 0) return { label: 'Sold out', tone: 'berry' };
  if (stock <= 5) return { label: `${stock} left`, tone: 'golden' };
  return { label: 'In stock', tone: 'sage' };
};
