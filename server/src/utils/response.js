export const sendSuccess = (res, data, { statusCode = 200, meta } = {}) =>
  res.status(statusCode).json({
    success: true,
    data,
    ...(meta && { meta }),
  });
