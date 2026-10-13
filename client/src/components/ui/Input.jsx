import { useId } from 'react';

// Label is always rendered (visually hidden when `hideLabel`) so every field has an accessible name.
// `icon` draws a decorative icon inside the left edge of the field.
export default function Input({ label, error, hint, hideLabel = false, icon: Icon, className = '', id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className={hideLabel ? 'sr-only' : 'text-sm font-medium text-espresso'}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cocoa" />
        )}
        <input
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={[error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined}
          className={`h-11 w-full rounded-xl border bg-surface px-4 text-base text-espresso placeholder:text-cocoa/70 transition duration-200 focus:border-golden ${
            Icon ? 'pl-11' : ''
          } ${error ? 'border-berry' : 'border-line'}`}
          {...props}
        />
      </div>
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
