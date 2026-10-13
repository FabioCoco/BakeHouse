// Client-side checks that mirror server/src/validators/auth.js. The server remains the final check.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email) => {
  const value = email.trim();
  if (!value) return 'Email wajib diisi';
  if (!EMAIL_PATTERN.test(value)) return 'Format email tidak valid';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Kata sandi wajib diisi';
  if (password.length < 8 || password.length > 72) return 'Kata sandi harus 8 sampai 72 karakter';
  if (!/[A-Za-z]/.test(password)) return 'Kata sandi harus mengandung huruf';
  if (!/\d/.test(password)) return 'Kata sandi harus mengandung angka';
  return '';
};

export const validateLogin = ({ email, password }) => {
  const errors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!password) errors.password = 'Kata sandi wajib diisi';
  return errors;
};

export const validateRegister = ({ name, email, password }) => {
  const errors = {};
  if (!name.trim()) errors.name = 'Nama wajib diisi';
  else if (name.trim().length > 100) errors.name = 'Nama maksimal 100 karakter';
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
    if (!value) errors[field] = `${label} wajib diisi`;
    else if (value.length > max) errors[field] = `${label} maksimal ${max} karakter`;
    return value;
  };

  required('recipientName', 'Nama penerima', 100);

  const phone = required('phone', 'Nomor telepon', 20);
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = 'Nomor telepon tidak valid';

  required('street', 'Alamat', 200);
  required('city', 'Kota', 100);
  required('province', 'Provinsi', 100);

  const postal = required('postalCode', 'Kode pos', 10);
  if (postal && !POSTAL_CODE_PATTERN.test(postal)) errors.postalCode = 'Kode pos tidak valid';

  if ((values.label ?? '').trim().length > 40) errors.label = 'Label maksimal 40 karakter';

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
  images: '',
  stock: '0',
  isActive: true,
  discountPercent: '0',
  // Local date and time from <input type="datetime-local">. Empty means no limit.
  discountStartsAt: '',
  discountEndsAt: '',
};

const IMAGE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(jpg|jpeg|png|webp|avif)$/i;

// Mirrors server/src/validators/product.js. `isCreate` also checks the initial stock.
export const validateProduct = (values, { isCreate = false } = {}) => {
  const errors = {};
  const name = values.name.trim();
  if (!name) errors.name = 'Nama wajib diisi';
  else if (name.length > 120) errors.name = 'Nama maksimal 120 karakter';

  const description = values.description.trim();
  if (!description) errors.description = 'Deskripsi wajib diisi';
  else if (description.length > 2000) errors.description = 'Deskripsi maksimal 2000 karakter';

  const price = values.price.trim();
  if (price === '') errors.price = 'Harga wajib diisi';
  else if (!/^\d+$/.test(price)) errors.price = 'Harga harus bilangan bulat (Rupiah)';

  if (!values.category) errors.category = 'Pilih kategori';

  const images = parseImages(values.images);
  if (images.length > 10) errors.images = 'Maksimal 10 gambar';
  else if (images.some((file) => !IMAGE_FILENAME.test(file))) {
    errors.images = 'Nama file harus seperti "croissant.jpg" (jpg, jpeg, png, webp, avif)';
  }

  if (isCreate && values.stock.trim() !== '' && !/^\d+$/.test(values.stock.trim())) {
    errors.stock = 'Stok harus bilangan bulat, minimal 0';
  }

  const percent = values.discountPercent.trim();
  if (percent !== '' && (!/^\d+$/.test(percent) || Number(percent) > 90)) {
    errors.discountPercent = 'Diskon harus bilangan bulat 0 sampai 90';
  }

  const start = values.discountStartsAt;
  const end = values.discountEndsAt;
  if (start && end && new Date(end) <= new Date(start)) {
    errors.discountEndsAt = 'Waktu berakhir harus setelah waktu mulai';
  }

  return errors;
};

// Accepts "a.jpg, b.jpg" or one per line. Empty entries are dropped.
export const parseImages = (text) =>
  text
    .split(/[,\n]/)
    .map((file) => file.trim())
    .filter(Boolean);

export const toProductPayload = (values, { isCreate = false } = {}) => {
  const payload = {
    name: values.name.trim(),
    description: values.description.trim(),
    price: Number(values.price),
    category: values.category,
    origin: values.origin,
    images: parseImages(values.images),
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
  if (!name) errors.name = 'Nama wajib diisi';
  else if (name.length > 60) errors.name = 'Nama maksimal 60 karakter';
  if (values.description.trim().length > 300) errors.description = 'Deskripsi maksimal 300 karakter';
  return errors;
};

// Maps API validation errors ([{ field, message }]) to a { field: message } object for inline display.
export const mapServerErrors = (errors = []) =>
  errors.reduce((acc, { field, message }) => {
    if (field && !acc[field]) acc[field] = message;
    return acc;
  }, {});
