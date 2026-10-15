import Badge from '../ui/Badge.jsx';
import StarRating from './StarRating.jsx';
import { formatDate } from '../../utils/formatDate.js';

// Each review came from a completed order, so every entry is marked as a verified buyer.
export default function ReviewList({ reviews }) {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {reviews.map((review) => (
        <li key={review._id} className="flex flex-col gap-3 py-6">
          <div className="flex flex-wrap items-center gap-3">
            <StarRating value={review.rating} size={14} />
            <span className="font-medium text-espresso">{review.user?.name ?? 'Customer'}</span>
            <Badge tone="sage">Verified buyer</Badge>
            <time dateTime={review.createdAt} className="text-sm text-cocoa">
              {formatDate(review.createdAt)}
            </time>
          </div>
          <p className="text-espresso">{review.comment}</p>
        </li>
      ))}
    </ul>
  );
}
