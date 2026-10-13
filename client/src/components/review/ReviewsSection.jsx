import { useState } from 'react';
import RatingSummary from './RatingSummary.jsx';
import ReviewList from './ReviewList.jsx';
import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Pagination from '../ui/Pagination.jsx';
import Select from '../ui/Select.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import useFetch from '../../hooks/useFetch.js';
import { reviewService } from '../../services/reviewService.js';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'highest', label: 'Rating tertinggi' },
];

// Rating summary, sort, and the paginated list of visible reviews for one product.
export default function ReviewsSection({ slug }) {
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const reviews = useFetch(() => reviewService.list(slug, { sort, page, limit: 5 }), [slug, sort, page]);
  const items = reviews.body?.data ?? [];
  const meta = reviews.body?.meta;

  return (
    <section aria-labelledby="reviews-title" className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="eyebrow">Ulasan pembeli</p>
        <h2 id="reviews-title" className="text-4xl">
          Apa kata pelanggan
        </h2>
      </div>

      <Card className="p-6 md:p-8">
        {reviews.loading && !meta && <Skeleton className="h-32 w-full" />}
        {meta && <RatingSummary average={meta.ratingAverage} count={meta.ratingCount} distribution={meta.distribution} />}
      </Card>

      {meta && meta.total > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-cocoa">{meta.total} ulasan ditampilkan</p>
            <div className="w-56">
              <Select
                label="Urutkan ulasan"
                hideLabel
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                options={SORT_OPTIONS}
              />
            </div>
          </div>
          <ReviewList reviews={items} />
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}

      {meta && meta.total === 0 && (
        <EmptyState title="Belum ada ulasan" description="Jadilah yang pertama mengulas roti ini setelah pesananmu selesai." />
      )}

      {reviews.error && <p className="text-cocoa">Ulasan belum bisa dimuat.</p>}
    </section>
  );
}
