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
    if (!rating) clientErrors.rating = 'Pilih rating dulu';
    const text = comment.trim();
    if (text.length < 10) clientErrors.comment = 'Ulasan minimal 10 karakter';
    if (text.length > 500) clientErrors.comment = 'Ulasan maksimal 500 karakter';
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSaving(true);
    try {
      const payload = { rating, comment: text };
      const saved = existing
        ? await reviewService.update(productSlug, payload)
        : await reviewService.create(productSlug, payload);
      toast.success(existing ? 'Ulasan diperbarui.' : 'Terima kasih atas ulasanmu!');
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
      toast.success('Ulasan dihapus.');
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
        <span className="text-sm font-medium text-espresso">Rating untuk {productName}</span>
        <StarRating value={rating} onChange={setRating} label={`Rating untuk ${productName}`} />
        {errors.rating && <p className="text-sm text-berry">{errors.rating}</p>}
      </div>

      <Textarea
        label="Ulasanmu"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        error={errors.comment}
        maxLength={500}
        rows={3}
        hint="10 sampai 500 karakter. Ceritakan rasa dan teksturnya."
      />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Menyimpan…' : existing ? 'Simpan Perubahan' : 'Kirim Ulasan'}
        </Button>
        {existing && (
          <Button type="button" variant="ghost" onClick={handleDelete} disabled={saving} className="text-berry hover:bg-berry/10">
            Hapus Ulasan
          </Button>
        )}
      </div>
    </form>
  );
}
