import { APIError } from '../utils/apiError.js';

// Format CastError (e.g., invalid ObjectID in route parameters)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new APIError(message, 400);
};

// Format Mongoose Duplicate Key Errors (e.g. non-unique email)
const handleDuplicateFieldsDB = (err) => {
  // Extract the duplicated field value from the error message using regex
  const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : '';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new APIError(message, 400);
};

// Format Mongoose Validation Errors
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new APIError(message, 400);
};

// Format Invalid JWT signature errors
const handleJWTError = () => new APIError('Invalid session token. Please log in again.', 401);

// Format Expired JWT errors
const handleJWTExpiredError = () => new APIError('Your session has expired. Please log in again.', 401);

// Dev Error response (includes stack trace and full error information)
const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

// Prod Error response (filters out stack traces and details, keeps it clean and user friendly)
const sendErrorProd = (err, req, res) => {
  // A. Operational, trusted error: send user-facing message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  } 
  // B. Programming or other unknown error: don't leak details to clients
  else {
    console.error('💥 UNEXPECTED SYSTEM ERROR:', err);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong on our server. Please try again later.',
    });
  }
};

/**
 * Global centralized error handler middleware
 */
export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    error.message = err.message;

    // Detect and handle specific MongoDB / Mongoose / JWT error conditions
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
