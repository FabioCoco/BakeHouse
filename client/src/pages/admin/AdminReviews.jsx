import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import StarRating from '../../components/review/StarRating.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import useFetch from '../../hooks/useFetch.js';
import useQueryParams from '../../hooks/useQueryParams.js';
import { reviewService } from '../../services/reviewService.js';
import { formatDateTime } from '../../utils/formatDate.js';

const VISIBILITY_OPTIONS = [
  { value: 'all', label: 'All reviews' },
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Disembunyikan' },
];

export default function AdminReviews() {
  const [searchParams, setParams] = useQueryParams();
  const visibility = searchParams.get('visibility') || 'all';
  const page = Number(searchParams.get('page')) || 1;

  const [version, setVersion] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const reviews = useFetch(
    () => reviewService.adminList({ visibility, page, limit: 15 }),
    [visibility, page, version],
  );
  const items = reviews.body?.data ?? [];
  const meta = reviews.body?.meta;

  useEffect(() => {
    document.title = 'Reviews · Admin BakeHouse';
  }, []);

  const toggle = async (review) => {
    setBusyId(review._id);
    try {
      await reviewService.setVisibility(review._id, !review.isHidden);
      toast.success(review.isHidden ? 'Review is visible again.' : 'Review hidden from the shop.');
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="eyebrow">Moderation</p>
        <h1 className="text-4xl">Reviews</h1>
      </header>

      <Card className="p-5">
        <div className="max-w-xs">
          <Select
            label="Show"
            value={visibility}
            onChange={(event) => setParams({ visibility: event.target.value === 'all' ? undefined : event.target.value, page: undefined })}
            options={VISIBILITY_OPTIONS}
          />
        </div>
      </Card>

      {reviews.loading && <Skeleton className="h-96 w-full" />}
      {reviews.error && <p className="text-cocoa">{reviews.error.message}</p>}

      {!reviews.loading && !reviews.error && items.length === 0 && (
        <EmptyState title="No reviews found" description="Reviews from buyers will appear here." />
      )}

      {!reviews.loading && items.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-sand/20 text-cocoa">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Product</th>
                  <th scope="col" className="px-5 py-3 font-medium">Buyer</th>
                  <th scope="col" className="px-5 py-3 font-medium">Review</th>
                  <th scope="col" className="px-5 py-3 font-medium">Tanggal</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((review) => (
                  <tr key={review._id} className="align-top">
                    <td className="px-5 py-4 font-medium text-espresso">{review.product?.name ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className="block text-espresso">{review.user?.name ?? 'Account deleted'}</span>
                      <span className="text-xs text-cocoa">{review.user?.email}</span>
                    </td>
                    <td className="max-w-md px-5 py-4">
                      <StarRating value={review.rating} size={13} />
                      <p className="mt-2 text-espresso">{review.comment}</p>
                    </td>
                    <td className="px-5 py-4 text-cocoa">{formatDateTime(review.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <Badge tone={review.isHidden ? 'berry' : 'sage'}>{review.isHidden ? 'Hidden' : 'Visible'}</Badge>
                        <button
                          type="button"
                          onClick={() => toggle(review)}
                          disabled={busyId === review._id}
                          className="text-sm font-medium text-crust underline-offset-4 hover:underline disabled:opacity-50"
                        >
                          {review.isHidden ? 'Show' : 'Hide'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {meta && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onPageChange={(next) => setParams({ page: next > 1 ? next : undefined })}
        />
      )}
    </div>
  );
}
