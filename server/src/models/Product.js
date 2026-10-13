import mongoose from 'mongoose';
import { effectivePriceOf, isSaleActive } from '../utils/pricing.js';

export const PRODUCT_ORIGINS = ['France', 'Japan', 'Germany', 'Italy', 'Other'];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    // Rupiah, stored as a whole number so no floating point errors creep in.
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'price must be an integer' },
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    stock: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: 'stock must be an integer' },
    },
    // Filenames only, e.g. "croissant-butter.jpg". Served from /uploads.
    images: { type: [String], default: [] },
    origin: { type: String, enum: PRODUCT_ORIGINS, default: 'Other' },
    isActive: { type: Boolean, default: true },
    // Percentage off the list price. 0 means no discount.
    discountPercent: { type: Number, default: 0, min: 0, max: 90, validate: { validator: Number.isInteger, message: 'discountPercent must be an integer' } },
    discountStartsAt: { type: Date, default: null },
    discountEndsAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// Computed from the server clock on every read. Responses include them, so the client never works out a price itself.
productSchema.virtual('isOnSale').get(function isOnSale() {
  return isSaleActive(this);
});
productSchema.virtual('effectivePrice').get(function effectivePrice() {
  return effectivePriceOf(this);
});

productSchema.index({ name: 'text' });
productSchema.index({ isActive: 1, category: 1 });
productSchema.index({ isActive: 1, price: 1 });
productSchema.index({ isActive: 1, discountPercent: -1 });

export const Product = mongoose.model('Product', productSchema);
