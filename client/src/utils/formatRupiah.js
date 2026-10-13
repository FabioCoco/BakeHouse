const formatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

// Returns e.g. "Rp 45.000".
export const formatRupiah = (amount) => formatter.format(Number(amount) || 0);
