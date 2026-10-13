import { useState } from 'react';
import ReviewForm from './ReviewForm.jsx';
import StarRating from './StarRating.jsx';
import Card from '../ui/Card.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import useFetch from '../../hooks/useFetch.js';
import { reviewService } from '../../services/reviewService.js';

// Shown on a completed order for each product in it. Opens the review form, or shows the customer's review.
export default function OrderReviewPanel({ productSlug, productName }) {
  const mine = useFetch(() => reviewService.mine(productSlug), [productSlug]);
  // Null means "no change yet". After a save or delete, this holds the new value.
  const [updated, setUpdated] = useState(undefined);
  const review = updated !== undefined ? updated : mine.body;

  if (mine.loading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (mine.error) {
    return <p className="text-sm text-cocoa">Ulasan untuk {productName} belum bisa dimuat.</p>;
  }

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl">{productName}</h3>
        {review && (
          <div className="flex items-center gap-3">
            <StarRating value={review.rating} size={14} />
            <span className="text-sm text-cocoa">Ulasanmu sudah terkirim</span>
          </div>
        )}
      </div>
      <ReviewForm
        key={review?._id ?? 'new'}
        productSlug={productSlug}
        productName={productName}
        existing={review}
        onChanged={(next) => setUpdated(next)}
      />
    </Card>
  );
}
