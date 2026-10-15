import { useState } from 'react';
import toast from 'react-hot-toast';
import StarRating from './StarRating.jsx';
import Button from '../ui/Button.jsx';
import Textarea from '../ui/Textarea.jsx';
import { reviewService } from '../../services/reviewService.js';
import { mapServerErrors } from '../../utils/validators.js';

// Create, edit, or delete the signed-in customer's review of one product.
// Rules mirror server/src/validators/review.js: rating 1 to 5, comment 10 to 500 characters.
export default function ReviewForm({ productSlug, productName, existing, onChanged }) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clientErrors = {};
    if (!rating) clientErrors.rating = 'Choose a rating first';
    const text = comment.trim();
    if (text.length < 10) clientErrors.comment = 'Review must be at least 10 characters';
    if (text.length > 500) clientErrors.comment = 'Review must be at most 500 characters';
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSaving(true);
    try {
      const payload = { rating, comment: text };
      const saved = existing
        ? await reviewService.update(productSlug, payload)
        : await reviewService.create(productSlug, payload);
      toast.success(existing ? 'Review updated.' : 'Thank you for your review!');
      onChanged(saved);
    } catch (err) {
      const fieldErrors = mapServerErrors(err.errors);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await reviewService.remove(productSlug);
      toast.success('Review deleted.');
      onChanged(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-espresso">Rating for {productName}</span>
        <StarRating value={rating} onChange={setRating} label={`Rating for ${productName}`} />
        {errors.rating && <p className="text-sm text-berry">{errors.rating}</p>}
      </div>

      <Textarea
        label="Your review"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        error={errors.comment}
        maxLength={500}
        rows={3}
        hint="10 to 500 characters. Describe the taste and texture."
      />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Submit review'}
        </Button>
        {existing && (
          <Button type="button" variant="ghost" onClick={handleDelete} disabled={saving} className="text-berry hover:bg-berry/10">
            Delete review
          </Button>
        )}
      </div>
    </form>
  );
}
