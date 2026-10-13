import StarRating from './StarRating.jsx';

// Average, total, and one bar per star. Bars are scaled to the most common rating.
export default function RatingSummary({ average = 0, count = 0, distribution = {} }) {
  const max = Math.max(1, ...Object.values(distribution));

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-10">
      <div className="flex flex-col items-start gap-2">
        <p className="font-serif text-5xl text-espresso">{count ? average.toFixed(1) : '–'}</p>
        <StarRating value={average} size={18} />
        <p className="text-sm text-cocoa">{count} ulasan</p>
      </div>

      <ul className="flex flex-1 flex-col gap-2" aria-label="Distribusi rating">
        {[5, 4, 3, 2, 1].map((star) => {
          const total = distribution[star] ?? 0;
          return (
            <li key={star} className="flex items-center gap-3 text-sm">
              <span className="w-10 text-cocoa">{star} ★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="presentation">
                <div className="h-full rounded-full bg-crust transition-all duration-500" style={{ width: `${(total / max) * 100}%` }} />
              </div>
              <span className="w-8 text-right tabular-nums text-cocoa">{total}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
