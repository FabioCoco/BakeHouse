// Amounts are in Indonesian rupiah (IDR). en-US formatting gives e.g. "IDR 45,000".
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export const formatRupiah = (amount) => formatter.format(Number(amount) || 0);
