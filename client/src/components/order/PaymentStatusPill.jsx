import { PAYMENT_STATUS_MAP } from '../../utils/statusMap.js';

// Payment badge, shown next to the order status.
export default function PaymentStatusPill({ paymentStatus, className = '' }) {
  const entry = PAYMENT_STATUS_MAP[paymentStatus];
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${entry?.className ?? 'bg-sand/40 text-espresso'} ${className}`}>
      {entry?.label ?? paymentStatus}
    </span>
  );
}
