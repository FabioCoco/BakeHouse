// Order status labels and pill styles. Keys match ORDER_STATUSES in server/src/models/Order.js.
export const ORDER_STATUS_MAP = {
  pending_payment: {
    label: 'Menunggu Pembayaran',
    className: 'bg-honey text-crust',
  },
  processing: {
    label: 'Diproses',
    className: 'bg-sand text-espresso',
  },
  shipped: {
    label: 'Dikirim',
    className: 'bg-golden/20 text-espresso',
  },
  completed: {
    label: 'Selesai',
    className: 'bg-sage/15 text-sage',
  },
  cancelled: {
    label: 'Dibatalkan',
    className: 'bg-berry/10 text-berry',
  },
};

// Payment status labels. Keys match PAYMENT_STATUSES in server/src/models/Order.js.
export const PAYMENT_STATUS_MAP = {
  unpaid: { label: 'Belum Dibayar', className: 'bg-honey text-crust' },
  paid: { label: 'Lunas', className: 'bg-sage/15 text-sage' },
  failed: { label: 'Gagal', className: 'bg-berry/10 text-berry' },
  expired: { label: 'Kedaluwarsa', className: 'bg-berry/10 text-berry' },
  refunded: { label: 'Dikembalikan', className: 'bg-sand text-espresso' },
};
