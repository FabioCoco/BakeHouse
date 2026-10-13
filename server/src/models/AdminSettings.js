import mongoose from 'mongoose';

// Store-wide settings, kept as one singleton document. Model name 'Admin' follows the brief.
const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    subtitle: { type: String, trim: true, maxlength: 200, default: '' },
    // Either a full https URL or a file name inside /uploads/banners.
    image: { type: String, required: true, trim: true, maxlength: 300 },
    ctaLabel: { type: String, trim: true, maxlength: 40, default: '' },
    ctaLink: { type: String, trim: true, maxlength: 200, default: '' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0, min: 0 },
  },
  { _id: true },
);

const adminSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    announcement: { type: String, trim: true, maxlength: 160, default: '' },
    banners: { type: [bannerSchema], default: [] },
    featuredCategories: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], default: [] },
  },
  { timestamps: true },
);

export const AdminSettings = mongoose.model('Admin', adminSchema);
