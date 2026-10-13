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

// Maps API validation errors ([{ field, message }]) to a { field: message } object for inline display.
export const mapServerErrors = (errors = []) =>
  errors.reduce((acc, { field, message }) => {
    if (field && !acc[field]) acc[field] = message;
    return acc;
  }, {});
