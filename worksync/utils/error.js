/**
 * Create a standardized error object with a status code
 * Usage: next(createError(404, 'Resource not found'))
 */
const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * Wrap async route handlers to avoid try/catch boilerplate
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Send a standardized success response
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

module.exports = { createError, asyncHandler, sendSuccess };
