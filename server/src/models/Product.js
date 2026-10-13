import mongoose from 'mongoose';

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
  },
  { timestamps: true },
);

productSchema.index({ name: 'text' });
productSchema.index({ isActive: 1, category: 1 });
productSchema.index({ isActive: 1, price: 1 });

export const Product = mongoose.model('Product', productSchema);
