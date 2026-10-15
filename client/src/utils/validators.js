// Client-side checks that mirror server/src/validators/auth.js. The server remains the final check.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email) => {
  const value = email.trim();
  if (!value) return 'Email is required';
  if (!EMAIL_PATTERN.test(value)) return 'Email format is not valid';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8 || password.length > 72) return 'Password must be 8 to 72 characters';
  if (!/[A-Za-z]/.test(password)) return 'Password must contain a letter';
  if (!/\d/.test(password)) return 'Password must contain a number';
  return '';
};

export const validateLogin = ({ email, password }) => {
  const errors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!password) errors.password = 'Password is required';
  return errors;
};

export const validateRegister = ({ name, email, password }) => {
  const errors = {};
  if (!name.trim()) errors.name = 'Name is required';
  else if (name.trim().length > 100) errors.name = 'Name must be at most 100 characters';
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  return errors;
};

const PHONE_PATTERN = /^\+?[0-9\s()-]{6,20}$/;
const POSTAL_CODE_PATTERN = /^[0-9A-Za-z -]{3,10}$/;

export const ADDRESS_EMPTY = {
  label: '',
  recipientName: '',
  phone: '',
  street: '',
  city: '',
  province: '',
  postalCode: '',
};

// Mirrors server/src/validators/address.js. `label` is optional.
export const validateAddress = (values) => {
  const errors = {};
  const required = (field, label, max) => {
    const value = (values[field] ?? '').trim();
    if (!value) errors[field] = `${label} is required`;
    else if (value.length > max) errors[field] = `${label} must be at most ${max} characters`;
    return value;
  };

  required('recipientName', 'Recipient name', 100);

  const phone = required('phone', 'Phone number', 20);
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = 'Phone number is not valid';

  required('street', 'Street address', 200);
  required('city', 'City', 100);
  required('province', 'Province', 100);

  const postal = required('postalCode', 'Postal code', 10);
  if (postal && !POSTAL_CODE_PATTERN.test(postal)) errors.postalCode = 'Postal code is not valid';

  if ((values.label ?? '').trim().length > 40) errors.label = 'Label must be at most 40 characters';

  return errors;
};

// Sends only the fields the server should store. An empty label is left out so the server default applies.
export const toAddressPayload = (values) => {
  const payload = {
    recipientName: values.recipientName.trim(),
    phone: values.phone.trim(),
    street: values.street.trim(),
    city: values.city.trim(),
    province: values.province.trim(),
    postalCode: values.postalCode.trim(),
  };
  const label = (values.label ?? '').trim();
  if (label) payload.label = label;
  return payload;
};

export const PRODUCT_EMPTY = {
  name: '',
  description: '',
  price: '',
  category: '',
  origin: 'Other',
  images: [],
  stock: '0',
  isActive: true,
  discountPercent: '0',
  // Local date and time from <input type="datetime-local">. Empty means no limit.
  discountStartsAt: '',
  discountEndsAt: '',
};

// Mirrors server/src/validators/product.js. `isCreate` also checks the initial stock.
export const validateProduct = (values, { isCreate = false } = {}) => {
  const errors = {};
  const name = values.name.trim();
  if (!name) errors.name = 'Name is required';
  else if (name.length > 120) errors.name = 'Name must be at most 120 characters';

  const description = values.description.trim();
  if (!description) errors.description = 'Description is required';
  else if (description.length > 2000) errors.description = 'Description must be at most 2000 characters';

  const price = values.price.trim();
  if (price === '') errors.price = 'Price is required';
  else if (!/^\d+$/.test(price)) errors.price = 'Price must be a whole number (rupiah)';

  if (!values.category) errors.category = 'Choose a category';

  // Images come from the uploader, so every entry is already a stored file name.
  if (values.images.filter(Boolean).length > 10) errors.images = 'At most 10 images';

  if (isCreate && values.stock.trim() !== '' && !/^\d+$/.test(values.stock.trim())) {
    errors.stock = 'Stock must be a whole number, 0 or more';
  }

  const percent = values.discountPercent.trim();
  if (percent !== '' && (!/^\d+$/.test(percent) || Number(percent) > 90)) {
    errors.discountPercent = 'Discount must be a whole number from 0 to 90';
  }

  const start = values.discountStartsAt;
  const end = values.discountEndsAt;
  if (start && end && new Date(end) <= new Date(start)) {
    errors.discountEndsAt = 'End time must be after start time';
  }

  return errors;
};

export const toProductPayload = (values, { isCreate = false } = {}) => {
  const payload = {
    name: values.name.trim(),
    description: values.description.trim(),
    price: Number(values.price),
    category: values.category,
    origin: values.origin,
    images: values.images.filter(Boolean),
    isActive: Boolean(values.isActive),
  };
  if (isCreate) {
    payload.stock = values.stock.trim() === '' ? 0 : Number(values.stock);
  }

  // Empty discount values are sent as null, so a previously set discount can be cleared on edit.
  const percent = values.discountPercent.trim();
  payload.discountPercent = percent === '' ? 0 : Number(percent);
  payload.discountStartsAt = values.discountStartsAt ? new Date(values.discountStartsAt).toISOString() : null;
  payload.discountEndsAt = values.discountEndsAt ? new Date(values.discountEndsAt).toISOString() : null;
  return payload;
};

export const CATEGORY_EMPTY = { name: '', description: '' };

export const validateCategory = (values) => {
  const errors = {};
  const name = values.name.trim();
  if (!name) errors.name = 'Name is required';
  else if (name.length > 60) errors.name = 'Name must be at most 60 characters';
  if (values.description.trim().length > 300) errors.description = 'Description must be at most 300 characters';
  return errors;
};

// Maps API validation errors ([{ field, message }]) to a { field: message } object for inline display.
export const mapServerErrors = (errors = []) =>
  errors.reduce((acc, { field, message }) => {
    if (field && !acc[field]) acc[field] = message;
    return acc;
  }, {});
