import { useId } from 'react';

export default function Textarea({ label, error, hint, rows = 4, className = '', id, ...props }) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const errorId = `${textareaId}-error`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={textareaId} className="text-sm font-medium text-espresso">
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : undefined}
        className={`rounded-xl border bg-surface px-4 py-3 text-base text-espresso placeholder:text-cocoa/70 transition duration-200 focus:border-golden ${
          error ? 'border-berry' : 'border-line'
        }`}
        {...props}
      />
      {hint && !error && <p className="text-sm text-cocoa">{hint}</p>}
      {error && (
        <p id={errorId} className="text-sm text-berry">
          {error}
        </p>
      )}
    </div>
  );
}
