/**
 * Middleware: notFound
 * Catches requests to routes that don't exist and forwards a 404 error.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Middleware: errorHandler
 * Centralized Express error handler. Returns consistent JSON error responses.
 * Must be registered AFTER all routes and other middleware.
 */
const errorHandler = (err, req, res, next) => {
  // Use the status code already set on the response, or default to 500
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message,
    // Only include the stack trace in development to avoid leaking internals
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
