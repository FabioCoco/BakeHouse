// Order status labels and pill styles. Keys match ORDER_STATUSES in server/src/models/Order.js.
export const ORDER_STATUS_MAP = {
  pending_confirmation: {
    label: 'Menunggu Konfirmasi',
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
