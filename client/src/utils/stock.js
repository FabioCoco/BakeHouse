// Stock label rules from the brief: "Tersedia", "Sisa N" when 5 or fewer are left, "Habis" at zero.
export const getStockState = (stock) => {
  if (stock <= 0) return { label: 'Habis', tone: 'berry' };
  if (stock <= 5) return { label: `Sisa ${stock}`, tone: 'golden' };
  return { label: 'Tersedia', tone: 'sage' };
};
