import { ORDER_STATUS_MAP } from '../../utils/statusMap.js';

// Order status pill. Unknown statuses fall back to the raw value so nothing silently disappears.
export default function StatusPill({ status, className = '' }) {
  const entry = ORDER_STATUS_MAP[status];
  const label = entry?.label ?? status;
  const styles = entry?.className ?? 'bg-sand/40 text-espresso';

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles} ${className}`}>
      {label}
    </span>
  );
}
