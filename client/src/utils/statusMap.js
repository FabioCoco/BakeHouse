// Order status labels and pill styles. Keys match ORDER_STATUSES in server/src/models/Order.js.
export const ORDER_STATUS_MAP = {
  pending_payment: {
    label: 'Awaiting payment',
    className: 'bg-honey text-crust',
  },
  processing: {
    label: 'Processing',
    className: 'bg-sand text-espresso',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-golden/20 text-espresso',
  },
  completed: {
    label: 'Completed',
    className: 'bg-sage/15 text-sage',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-berry/10 text-berry',
  },
};

// Payment status labels. Keys match PAYMENT_STATUSES in server/src/models/Order.js.
export const PAYMENT_STATUS_MAP = {
  unpaid: { label: 'Unpaid', className: 'bg-honey text-crust' },
  paid: { label: 'Paid', className: 'bg-sage/15 text-sage' },
  failed: { label: 'Failed', className: 'bg-berry/10 text-berry' },
  expired: { label: 'Expired', className: 'bg-berry/10 text-berry' },
  refunded: { label: 'Refunded', className: 'bg-sand text-espresso' },
};
