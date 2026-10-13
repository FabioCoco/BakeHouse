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

// Maps API validation errors ([{ field, message }]) to a { field: message } object for inline display.
export const mapServerErrors = (errors = []) =>
  errors.reduce((acc, { field, message }) => {
    if (field && !acc[field]) acc[field] = message;
    return acc;
  }, {});
