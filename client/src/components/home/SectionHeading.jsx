import { Link } from 'react-router-dom';

// Eyebrow, serif title, and optional "see all" link used across the home sections.
export default function SectionHeading({ eyebrow, title, titleId, linkTo, linkLabel = 'Lihat semua' }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={titleId} className="text-4xl md:text-5xl">
          {title}
        </h2>
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="text-sm font-medium text-crust underline-offset-4 transition hover:text-crust-hover hover:underline"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
