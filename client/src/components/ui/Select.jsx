import { useId } from 'react';

export default function Select({ label, options = [], error, hideLabel = false, className = '', id, ...props }) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={selectId} className={hideLabel ? 'sr-only' : 'text-sm font-medium text-espresso'}>
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={Boolean(error) || undefined}
        className={`h-11 rounded-xl border bg-surface px-4 text-base text-espresso transition duration-200 focus:border-golden ${
          error ? 'border-berry' : 'border-line'
        }`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-berry">{error}</p>}
    </div>
  );
}
