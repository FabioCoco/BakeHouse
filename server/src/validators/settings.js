import { body, query } from 'express-validator';

const IMAGE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(jpg|jpeg|png|webp|avif)$/i;
const isHttpsUrl = (value) => /^https:\/\/\S+$/i.test(value);

export const settingsRules = () => [
  body('announcement').optional().isString().trim().isLength({ max: 160 }).withMessage('announcement must be at most 160 characters'),
  body('banners').optional().isArray({ max: 10 }).withMessage('banners must be an array of up to 10 items'),
  body('banners.*.title').isString().trim().notEmpty().withMessage('Banner title is required').isLength({ max: 100 }),
  body('banners.*.subtitle').optional({ values: 'null' }).isString().trim().isLength({ max: 200 }),
  body('banners.*.image')
    .isString()
    .trim()
    .custom((value) => isHttpsUrl(value) || IMAGE_FILENAME.test(value))
    .withMessage('Banner image must be an https URL or an image file name such as "promo.jpg"'),
  body('banners.*.ctaLabel').optional({ values: 'null' }).isString().trim().isLength({ max: 40 }),
  body('banners.*.ctaLink')
    .optional({ values: 'null' })
    .isString()
    .trim()
    .isLength({ max: 200 })
    .custom((value) => value === '' || value.startsWith('/') || isHttpsUrl(value))
    .withMessage('Banner link must start with "/" or be an https URL'),
  body('banners.*.isActive').optional().isBoolean().withMessage('isActive must be a boolean').toBoolean(),
  body('banners.*.sortOrder').optional().isInt({ min: 0, max: 999 }).withMessage('sortOrder must be 0 to 999').toInt(),
  body('featuredCategories').optional().isArray({ max: 6 }).withMessage('featuredCategories can hold up to 6 categories'),
  body('featuredCategories.*').isMongoId().withMessage('Each featured category must be a valid id'),
];

export const analyticsQuery = () => [
  query('range').optional().isIn(['7d', '30d', '90d']).withMessage('range must be 7d, 30d, or 90d'),
];
