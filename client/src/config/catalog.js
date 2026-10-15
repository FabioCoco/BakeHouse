// Origin values must match PRODUCT_ORIGINS in server/src/models/Product.js.
export const ORIGINS = ['France', 'Japan', 'Germany', 'Italy', 'Other'];

export const ORIGIN_LABELS = {
  France: 'France',
  Japan: 'Japan',
  Germany: 'Germany',
  Italy: 'Italy',
  Other: 'Other',
};

// Sort values must match PRODUCT_SORTS in server/src/validators/product.js.
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'discount', label: 'Biggest discount' },
];

export const PRODUCTS_PER_PAGE = 12;
