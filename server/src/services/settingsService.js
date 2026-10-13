import { AdminSettings } from '../models/AdminSettings.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';

const getOrCreate = () =>
  AdminSettings.findOneAndUpdate({ key: 'default' }, { $setOnInsert: { key: 'default' } }, { upsert: true, new: true });

// What the storefront sees: the announcement, active banners in order, and featured categories.
export const getPublicSettings = async () => {
  const settings = await getOrCreate();
  await settings.populate('featuredCategories', 'name slug');

  return {
    announcement: settings.announcement,
    banners: settings.banners
      .filter((banner) => banner.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((banner) => ({
        _id: banner._id,
        title: banner.title,
        subtitle: banner.subtitle,
        image: banner.image,
        ctaLabel: banner.ctaLabel,
        ctaLink: banner.ctaLink,
      })),
    featuredCategories: settings.featuredCategories.filter(Boolean).map((c) => ({ _id: c._id, name: c.name, slug: c.slug })),
  };
};

// Full settings for the admin page, including inactive banners.
export const getAdminSettings = async () => {
  const settings = await getOrCreate();
  return settings.populate('featuredCategories', 'name slug');
};

// Replaces the whole banner list and featured categories. The client always sends the complete state.
export const updateSettings = async ({ announcement, banners, featuredCategories }) => {
  if (featuredCategories) {
    const found = await Category.countDocuments({ _id: { $in: featuredCategories } });
    if (found !== new Set(featuredCategories.map(String)).size) {
      throw ApiError.badRequest('Validation failed', [{ field: 'featuredCategories', message: 'Some categories do not exist' }]);
    }
  }

  const settings = await getOrCreate();
  if (announcement !== undefined) settings.announcement = announcement;
  if (banners !== undefined) settings.banners = banners;
  if (featuredCategories !== undefined) settings.featuredCategories = featuredCategories;
  await settings.save();

  return getAdminSettings();
};
