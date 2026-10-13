import { Star } from 'lucide-react';

// Shows a rating. With onChange it becomes a picker: each star is a button, so keyboard users can choose a value.
export default function StarRating({ value = 0, onChange, size = 16, className = '', label }) {
  const rounded = Math.round(value);

  if (onChange) {
    return (
      <div role="radiogroup" aria-label={label ?? 'Rating'} className={`flex items-center gap-1 ${className}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rounded === star}
            aria-label={`${star} bintang`}
            onClick={() => onChange(star)}
            className="rounded-full p-1 text-golden transition hover:scale-110"
          >
            <Star size={size + 6} aria-hidden="true" className={star <= rounded ? 'fill-golden' : 'text-line'} />
          </button>
        ))}
      </div>
    );
  }

  return (
    <span
      role="img"
      aria-label={`Rating ${value ? value.toFixed(1) : 'belum ada'} dari 5`}
      className={`inline-flex items-center gap-0.5 text-golden ${className}`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} aria-hidden="true" className={star <= rounded ? 'fill-golden' : 'text-line'} />
      ))}
    </span>
  );
}
