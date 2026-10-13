// Origin values must match PRODUCT_ORIGINS in server/src/models/Product.js.
export const ORIGINS = ['France', 'Japan', 'Germany', 'Italy', 'Other'];

export const ORIGIN_LABELS = {
  France: 'Prancis',
  Japan: 'Jepang',
  Germany: 'Jerman',
  Italy: 'Italia',
  Other: 'Lainnya',
};

// Sort values must match PRODUCT_SORTS in server/src/validators/product.js.
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga terendah' },
  { value: 'price_desc', label: 'Harga tertinggi' },
  { value: 'name', label: 'Nama A–Z' },
];

export const PRODUCTS_PER_PAGE = 12;
