/**
 * Centralized Error Handler Middleware
 * Handles all errors and returns consistent error responses
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Handle custom application errors
  if (err.isOperational) {
    statusCode = err.statusCode;
    message = err.message;
    if (err.errors) {
      errors = err.errors;
    }
  }
  // Handle Sequelize validation errors
  else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
  }
  // Handle Sequelize unique constraint errors
  else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Resource already exists with this value.';
    if (err.errors && err.errors.length > 0) {
      errors = err.errors.map(e => ({
        field: e.path,
        message: e.message
      }));
    }
  }
  // Handle Sequelize foreign key constraint errors
  else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Invalid reference to related resource.';
  }
  // Handle Sequelize database errors
  else if (err.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    message = process.env.NODE_ENV === 'production' 
      ? 'Database error occurred.' 
      : err.message;
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired.';
  }
  // Handle Multer file upload errors
  else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the maximum allowed limit.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded.';
    } else {
      message = 'File upload error occurred.';
    }
  }
  // Handle unknown errors
  else {
    // Log error for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', err);
    }
    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production') {
      message = 'An unexpected error occurred.';
    }
  }

  // Build error response
  const errorResponse = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err.name
    })
  };

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;

