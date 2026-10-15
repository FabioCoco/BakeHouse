// "-20%" chip shown on products whose discount is active right now.
export default function SaleBadge({ discountPercent, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-crust px-3 py-1 text-xs font-semibold text-surface ${className}`}
      aria-label={`${discountPercent}% discount`}
    >
      -{discountPercent}%
    </span>
  );
}
