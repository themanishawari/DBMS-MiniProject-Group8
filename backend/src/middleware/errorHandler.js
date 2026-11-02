/**
 * Centralized Error Handling Middleware for Express
 */

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // MySQL specific errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with this identifier or unique value already exists.',
      detail: err.sqlMessage || err.message,
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({
      success: false,
      message: 'Referential integrity constraint failed. Check your foreign key references.',
      detail: err.sqlMessage || err.message,
    });
  }

  if (err.code === 'ER_DATA_TOO_LONG') {
    return res.status(400).json({
      success: false,
      message: 'Data provided exceeds maximum column length.',
      detail: err.sqlMessage || err.message,
    });
  }

  // Generic handled or unhandled exception
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
