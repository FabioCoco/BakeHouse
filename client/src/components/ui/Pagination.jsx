import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Halaman sebelumnya"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface transition hover:border-sand-dark disabled:opacity-40"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <span className="text-sm text-cocoa">
        Halaman <span className="font-semibold text-espresso">{page}</span> dari {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Halaman berikutnya"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface transition hover:border-sand-dark disabled:opacity-40"
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}
