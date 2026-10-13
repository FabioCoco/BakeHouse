import mongoose from 'mongoose';

// One review per customer per product. The order is the completed purchase that made the review eligible.
const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5, validate: { validator: Number.isInteger, message: 'rating must be an integer' } },
    comment: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
    // Hidden reviews are kept for the admin but excluded from ratings and public lists.
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true },
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, isHidden: 1, createdAt: -1 });
reviewSchema.index({ isHidden: 1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);
