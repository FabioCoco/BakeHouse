// Strips keys containing "$" or "." from user input to block NoSQL operator injection.
const stripUnsafeKeys = (value) => {
  if (Array.isArray(value)) {
    value.forEach(stripUnsafeKeys);
    return value;
  }

  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
      } else {
        stripUnsafeKeys(value[key]);
      }
    }
  }

  return value;
};

export const sanitizeInput = (req, _res, next) => {
  stripUnsafeKeys(req.body);
  stripUnsafeKeys(req.params);
  stripUnsafeKeys(req.query);
  next();
};
