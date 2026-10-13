import { Minus, Plus } from 'lucide-react';

// Quantity control capped at `max` (the product's stock). Set `max` to 0 to disable it.
export default function QuantityStepper({ value, min = 1, max = 99, onChange, label = 'Jumlah', disabled = false }) {
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-full border border-line bg-surface">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={!canDecrease}
        aria-label="Kurangi jumlah"
        className="flex h-10 w-10 items-center justify-center rounded-full text-espresso transition hover:bg-sand/40 disabled:opacity-40"
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <span aria-live="polite" className="min-w-10 text-center text-base font-medium tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={!canIncrease}
        aria-label="Tambah jumlah"
        className="flex h-10 w-10 items-center justify-center rounded-full text-espresso transition hover:bg-sand/40 disabled:opacity-40"
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
