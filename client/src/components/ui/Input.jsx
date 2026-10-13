import { useId } from 'react';

// Label is always rendered (visually hidden when `hideLabel`) so every field has an accessible name.
export default function Input({ label, error, hint, hideLabel = false, className = '', id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className={hideLabel ? 'sr-only' : 'text-sm font-medium text-espresso'}>
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={[error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined}
        className={`h-11 rounded-xl border bg-surface px-4 text-base text-espresso placeholder:text-cocoa/70 transition duration-200 focus:border-golden ${
          error ? 'border-berry' : 'border-line'
        }`}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-sm text-cocoa">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-berry">
          {error}
        </p>
      )}
    </div>
  );
}
